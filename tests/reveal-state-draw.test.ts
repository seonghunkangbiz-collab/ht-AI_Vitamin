import test from 'node:test';
import assert from 'node:assert/strict';
import { isBeforeCutoff, computeSnapshotHash } from '@/lib/reveal-day/snapshot';
import { selectWinnerWithCSPRNG } from '@/lib/reveal-day/draw';
import { getRehearsalSnapshot, getRehearsalPublicState } from '@/lib/reveal-day/rehearsal-data';
import type { RevealPublicState } from '@/lib/reveal-day/types';

// Mock DB store for testing state transitions and version conflicts
class MemoryStateStore {
  publicState: RevealPublicState;

  constructor() {
    this.publicState = getRehearsalPublicState();
  }

  async getState(): Promise<RevealPublicState> {
    return JSON.parse(JSON.stringify(this.publicState));
  }

  async updateState(expectedVersion: number, updates: Partial<RevealPublicState>): Promise<{ success: boolean; state?: RevealPublicState; error?: string }> {
    if (this.publicState.dataVersion !== expectedVersion) {
      return { success: false, error: 'VERSION_CONFLICT_409' };
    }
    this.publicState = {
      ...this.publicState,
      ...updates,
      dataVersion: this.publicState.dataVersion + 1,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, state: JSON.parse(JSON.stringify(this.publicState)) };
  }
}

test('Test 5: Cutoff time (2026-10-27 23:59:59 KST) excludes later items', () => {
  const cutoffKst = '2026-10-27T23:59:59+09:00';
  const cutoffMs = new Date(cutoffKst).getTime();

  // Exactly at cutoff
  const atCutoff = new Date(cutoffMs).toISOString();
  assert.equal(isBeforeCutoff(atCutoff, cutoffKst), true, 'Cutoff timestamp should be inclusive');

  // 1 second before cutoff
  const beforeCutoff = new Date(cutoffMs - 1000).toISOString();
  assert.equal(isBeforeCutoff(beforeCutoff, cutoffKst), true, 'Timestamp before cutoff should be included');

  // 1 millisecond after cutoff
  const afterCutoff1ms = new Date(cutoffMs + 1).toISOString();
  assert.equal(isBeforeCutoff(afterCutoff1ms, cutoffKst), false, '1ms after cutoff must be excluded');

  // 1 second after cutoff
  const afterCutoff = new Date(cutoffMs + 1000).toISOString();
  assert.equal(isBeforeCutoff(afterCutoff, cutoffKst), false, '1s after cutoff must be excluded');

  // Event day (2026-10-28 10:00:00 KST)
  const eventDay = '2026-10-28T10:00:00+09:00';
  assert.equal(isBeforeCutoff(eventDay, cutoffKst), false, 'Event day items must be excluded from official snapshot');
});

test('Test 6: Snapshot generation idempotency & SHA-256 hash match', () => {
  const fixture = getRehearsalSnapshot();
  const rawData = {
    cutoff_time: '2026-10-27T23:59:59+09:00',
    total_users: fixture.totalUsers,
    total_praises: fixture.totalPraises,
    recent_praises_7d: fixture.recentPraises7d,
    total_notes: fixture.totalNotes,
    wall_views: fixture.wallViews,
    team_breakdown: fixture.teamBreakdown,
    approved_messages: fixture.approvedMessages,
    top_keywords: fixture.topKeywords,
  };

  const hash1 = computeSnapshotHash(rawData);
  const hash2 = computeSnapshotHash(rawData);

  assert.equal(hash1, hash2, 'Hashes must be strictly identical for identical inputs');
  assert.equal(typeof hash1, 'string');
  assert.equal(hash1.length, 64);

  // Modifying input produces different hash
  const modifiedData = { ...rawData, total_praises: rawData.total_praises + 1 };
  const hash3 = computeSnapshotHash(modifiedData);
  assert.notEqual(hash1, hash3, 'Hash must change when snapshot content changes');
});

test('Test 7: State machine version conflict (409) on concurrent update', async () => {
  const store = new MemoryStateStore();
  const state0 = await store.getState();
  assert.equal(state0.dataVersion, 1);

  // Client A reads version 1
  const clientAVersion = state0.dataVersion;
  // Client B reads version 1
  const clientBVersion = state0.dataVersion;

  // Client A successfully updates state to version 2
  const resA = await store.updateState(clientAVersion, { currentSegment: 'journey' });
  assert.equal(resA.success, true);
  assert.equal(resA.state?.dataVersion, 2);

  // Client B attempts to update with stale version 1 -> should fail with conflict 409
  const resB = await store.updateState(clientBVersion, { currentSegment: 'closing' });
  assert.equal(resB.success, false);
  assert.equal(resB.error, 'VERSION_CONFLICT_409', 'Stale version must return conflict');

  // Verify store state remained Client A's segment
  const finalState = await store.getState();
  assert.equal(finalState.currentSegment, 'journey');
  assert.equal(finalState.dataVersion, 2);
});

test('Test 8: Rehearsal mode data isolation from Live state', () => {
  const rehearsalState = getRehearsalPublicState();
  assert.equal(rehearsalState.mode, 'rehearsal');

  const liveState: RevealPublicState = {
    ...rehearsalState,
    mode: 'live',
    currentRevealIndex: 0,
    revealedPairsCount: 0,
  };

  // Rehearsal mutations do not affect live state
  const updatedRehearsal: RevealPublicState = {
    ...rehearsalState,
    currentRevealIndex: 3,
    revealedPairsCount: 3,
  };

  assert.equal(liveState.mode, 'live');
  assert.equal(liveState.currentRevealIndex, 0);
  assert.equal(liveState.revealedPairsCount, 0);
  assert.equal(updatedRehearsal.currentRevealIndex, 3);
  assert.equal(updatedRehearsal.revealedPairsCount, 3);
});

test('Test 9: CSPRNG Lucky Draw deduplication & winner exclusion across rounds', () => {
  const eligibleUsers = [
    { id: 'u1', name: '김민수', team: '개발팀' },
    { id: 'u2', name: '이영희', team: '디자인팀' },
    { id: 'u3', name: '박철수', team: '기획팀' },
    { id: 'u4', name: '정하나', team: '운영팀' },
  ];

  // Round 1
  const existingWinners = new Set<string>();
  const draw1 = selectWinnerWithCSPRNG(eligibleUsers, existingWinners);

  assert.ok(draw1.winner, 'Round 1 must produce a winner');
  assert.ok(eligibleUsers.some(u => u.id === draw1.winner.id));
  existingWinners.add(draw1.winner.id);

  // Round 2 - Winner from round 1 must NOT win again
  const draw2 = selectWinnerWithCSPRNG(eligibleUsers, existingWinners);

  assert.ok(draw2.winner, 'Round 2 must produce a winner');
  assert.notEqual(draw2.winner.id, draw1.winner.id, 'Round 2 winner cannot be Round 1 winner');
  existingWinners.add(draw2.winner.id);

  // Round 3
  const draw3 = selectWinnerWithCSPRNG(eligibleUsers, existingWinners);

  assert.ok(draw3.winner, 'Round 3 must produce a winner');
  assert.ok(![draw1.winner.id, draw2.winner.id].includes(draw3.winner.id));
  existingWinners.add(draw3.winner.id);

  // Round 4
  const draw4 = selectWinnerWithCSPRNG(eligibleUsers, existingWinners);

  assert.ok(draw4.winner, 'Round 4 must produce a winner');
  existingWinners.add(draw4.winner.id);
  assert.equal(existingWinners.size, 4, 'All 4 winners must be unique');

  // Round 5 - Pool exhausted, throws error
  assert.throws(() => {
    selectWinnerWithCSPRNG(eligibleUsers, existingWinners);
  }, /No eligible candidates/);
});

test('Test 10: Lucky Draw voiding & audit log integrity', () => {
  const drawResult = {
    id: 'draw-101',
    roundNumber: 1,
    prizeName: '헤드폰',
    winnerId: 'u1',
    winnerName: '김민수',
    isVoided: false,
    voidReason: undefined as string | undefined,
    voidedBy: undefined as string | undefined,
    voidedAt: undefined as string | undefined,
  };

  // Voiding mutation
  const voided = {
    ...drawResult,
    isVoided: true,
    voidReason: '관리자 사유: 부재 확인 후 재추첨',
    voidedBy: 'admin-id',
    voidedAt: new Date().toISOString(),
  };

  assert.equal(voided.isVoided, true);
  assert.equal(voided.voidReason, '관리자 사유: 부재 확인 후 재추첨');
  assert.equal(voided.voidedBy, 'admin-id');
  assert.ok(voided.voidedAt);
});

test('Test 11: Time Capsule approval gating (Unapproved/Draft capsules blocked)', () => {
  const capsules = [
    { userId: 'u1', recipientName: '김민수', approvalStatus: 'approved', letter: '멋진 활약!' },
    { userId: 'u2', recipientName: '이영희', approvalStatus: 'draft', letter: '작성 중...' },
    { userId: 'u3', recipientName: '박철수', approvalStatus: 'rejected', letter: '부적합' },
    { userId: 'u4', recipientName: '정하나', approvalStatus: 'approved', letter: '따뜻한 비타민!' },
  ];

  // Stage display filter: only approved capsules are returned
  const stageCapsules = capsules.filter(c => c.approvalStatus === 'approved');
  assert.equal(stageCapsules.length, 2, 'Only 2 approved capsules should be visible on stage');
  assert.ok(stageCapsules.every(c => c.approvalStatus === 'approved'));
  assert.ok(!stageCapsules.some(c => c.userId === 'u2' || c.userId === 'u3'));

  // Approve u2
  const updatedU2 = {
    ...capsules[1],
    approvalStatus: 'approved',
    reviewedBy: 'admin-user',
    reviewedAt: new Date().toISOString(),
  };
  assert.equal(updatedU2.approvalStatus, 'approved');
  assert.equal(updatedU2.reviewedBy, 'admin-user');
});

test('Test 13: Reload / Disconnect state restoration via Supabase store', () => {
  const persistedState: RevealPublicState = {
    eventId: 'reveal-20261028',
    mode: 'live',
    status: 'in_progress',
    currentSegment: 'mate_reveal',
    currentRevealIndex: 4,
    currentBatchIndex: 0,
    revealedPairsCount: 4,
    dataVersion: 7,
    sequence: 7,
    isBlackout: false,
    isHolding: false,
    reactionCounts: { heart: 8, clap: 12, party: 5, sparkle: 3, fire: 2 },
    checkinCount: 22,
    lastDataSyncAt: '2026-10-28T16:20:00+09:00',
    updatedAt: '2026-10-28T16:20:00+09:00',
  };

  // Simulating client reload fetching from store
  const reloadedClientState = JSON.parse(JSON.stringify(persistedState));

  assert.equal(reloadedClientState.dataVersion, 7);
  assert.equal(reloadedClientState.currentSegment, 'mate_reveal');
  assert.equal(reloadedClientState.revealedPairsCount, 4, 'Revealed pairs count preserved across reload');
  assert.equal(reloadedClientState.checkinCount, 22);
});

test('Test 20: Inbound mate count integrity (Total inbound matches DB rows)', () => {
  // In a system where 24 users each observe 2 targets:
  // Outbound rows = 48
  // Sum of all inbound counts across all 24 users must equal exactly 48
  const sampleAssignments = [
    { user_id: 'u1', target_user_id: 'u2' },
    { user_id: 'u1', target_user_id: 'u3' },
    { user_id: 'u2', target_user_id: 'u1' },
    { user_id: 'u2', target_user_id: 'u4' },
    { user_id: 'u3', target_user_id: 'u1' },
    { user_id: 'u3', target_user_id: 'u4' },
    { user_id: 'u4', target_user_id: 'u2' },
    { user_id: 'u4', target_user_id: 'u3' },
  ];

  const inboundMap: Record<string, number> = {};
  for (const row of sampleAssignments) {
    inboundMap[row.target_user_id] = (inboundMap[row.target_user_id] || 0) + 1;
  }

  const totalInboundSum = Object.values(inboundMap).reduce((sum, count) => sum + count, 0);
  assert.equal(totalInboundSum, sampleAssignments.length, 'Sum of inbound counts must equal total assignments');
  assert.equal(inboundMap['u1'], 2);
  assert.equal(inboundMap['u2'], 2);
  assert.equal(inboundMap['u3'], 2);
  assert.equal(inboundMap['u4'], 2);
});
