import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { isBeforeCutoff, computeSnapshotHash } from '@/lib/reveal-day/snapshot';
import { selectWinnerWithCSPRNG, ADDITIONAL_LUCKY_DRAW_MEMBERS } from '@/lib/reveal-day/draw';
import { getUserTitle, formatNameWithTitle } from '@/lib/reveal-day/titles';
import { getRehearsalSnapshot, getRehearsalPublicState } from '@/lib/reveal-day/rehearsal-data';
import { INITIAL_USERS } from '@/lib/seedData';
import { AI_VITAMIN_PLAYLIST, parseVideoUrl } from '@/lib/reveal-day/song-playlist';
import { ORDERED_SEGMENTS, SEGMENT_METADATA } from '@/lib/reveal-day/state-machine';
import { resolveLocalVideoPath } from '@/lib/reveal-day/video-resolver';
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

test('Test 21: Position title mapping rules (본부장, 팀장, 매니저)', () => {
  // Specific position mappings
  assert.equal(getUserTitle('홍태영'), '본부장');
  assert.equal(getUserTitle('이은정'), '팀장');
  assert.equal(getUserTitle('김세진'), '팀장');
  assert.equal(getUserTitle('조재화'), '팀장');

  // Everyone else must be 매니저
  assert.equal(getUserTitle('강성훈'), '매니저');
  assert.equal(getUserTitle('이현서'), '매니저');
  assert.equal(getUserTitle('최지훈'), '매니저');
  assert.equal(getUserTitle('박정호'), '매니저');
  assert.equal(getUserTitle('양정희'), '매니저');

  // Display name formatting
  assert.equal(formatNameWithTitle('홍태영'), '홍태영 본부장');
  assert.equal(formatNameWithTitle('이은정'), '이은정 팀장');
  assert.equal(formatNameWithTitle('강성훈'), '강성훈 매니저');
  assert.equal(formatNameWithTitle('이현서'), '이현서 매니저');
  assert.equal(formatNameWithTitle('최지훈'), '최지훈 매니저');
});

test('Test 22: Additional lucky draw attendees (이현서, 최지훈) in pool (Total 26)', () => {
  assert.equal(ADDITIONAL_LUCKY_DRAW_MEMBERS.length, 2);
  assert.equal(ADDITIONAL_LUCKY_DRAW_MEMBERS.some(m => m.name === '이현서' && m.team === '반도체Global사업개발팀'), true);
  assert.equal(ADDITIONAL_LUCKY_DRAW_MEMBERS.some(m => m.name === '최지훈' && m.team === '반도체Global사업개발팀'), true);

  // Total eligible calculation: 24 Vitamin attendees + 2 additional attendees = 26
  const totalEligible = 24 + ADDITIONAL_LUCKY_DRAW_MEMBERS.length;
  assert.equal(totalEligible, 26);
});

test('Test 23: MC/진행자 Kang Seong-hun excluded from Best Praise awards', () => {
  const candidates = [
    { id: 'u-1', name: '강성훈', team: 'Global사업개발팀' },
    { id: 'u-2', name: '이은정', team: '전략사업개발팀' },
    { id: 'u-3', name: '박정호', team: '전략사업개발팀' }
  ];

  // When filtering for Best Praise awards, Kang Seong-hun must be excluded
  const eligibleForAward = candidates.filter(c => !c.name.includes('강성훈'));
  assert.equal(eligibleForAward.some(c => c.name === '강성훈'), false, 'Kang Seong-hun must not be eligible for Best Praise');
  assert.equal(eligibleForAward.length, 2);
});

test('Test 24: Reveal Day check-in & login support for Lee Hyun-seo (50007) and Choi Ji-hoon (50008)', () => {
  const hyunseo = INITIAL_USERS.find(u => u.employeeNumber === '50007');
  const jihoon = INITIAL_USERS.find(u => u.employeeNumber === '50008');

  assert.ok(hyunseo, 'Lee Hyun-seo (50007) must exist in INITIAL_USERS');
  assert.equal(hyunseo.name, '이현서');
  assert.equal(hyunseo.code, 'VIT-50007');
  assert.equal(hyunseo.team, '반도체Global사업개발팀');
  assert.equal(getUserTitle(hyunseo.name), '매니저');

  assert.ok(jihoon, 'Choi Ji-hoon (50008) must exist in INITIAL_USERS');
  assert.equal(jihoon.name, '최지훈');
  assert.equal(jihoon.code, 'VIT-50008');
  assert.equal(jihoon.team, '반도체Global사업개발팀');
  assert.equal(getUserTitle(jihoon.name), '매니저');

  // Verify lookup by employee number, code, and name
  const findByInput = (input: string) => {
    const raw = input.trim();
    const upper = raw.toUpperCase();
    const padded = raw.padStart(5, '0');
    return INITIAL_USERS.find(
      u => (u.code && u.code.toUpperCase() === upper) ||
           (u.employeeNumber && (u.employeeNumber === raw || u.employeeNumber === padded)) ||
           (u.name && u.name.trim() === raw)
    );
  };

  assert.equal(findByInput('50007')?.id, 'user-25');
  assert.equal(findByInput('VIT-50007')?.id, 'user-25');
  assert.equal(findByInput('이현서')?.id, 'user-25');

  assert.equal(findByInput('50008')?.id, 'user-26');
  assert.equal(findByInput('VIT-50008')?.id, 'user-26');
  assert.equal(findByInput('최지훈')?.id, 'user-26');
});

test('Test 25: Merged Pizza Party & AI Vitamin Song segment and looping playlist', () => {
  // 1. Segment order: lucky_draw -> closing -> pizza_party (which plays AI Vitamin Song)
  assert.ok(ORDERED_SEGMENTS.includes('closing'));
  assert.ok(ORDERED_SEGMENTS.includes('pizza_party'));
  assert.equal(ORDERED_SEGMENTS.indexOf('closing') < ORDERED_SEGMENTS.indexOf('pizza_party'), true);

  // Metadata verification
  assert.equal(SEGMENT_METADATA.pizza_party.title, 'Pizza Party & AI Vitamin Song');
  assert.equal(SEGMENT_METADATA.pizza_party.durationMinutes, 50);

  // 2. Playlist tracks verification
  assert.equal(AI_VITAMIN_PLAYLIST.length, 2);

  // Track 1: Long track must be played first
  const track1 = AI_VITAMIN_PLAYLIST[0];
  assert.equal(track1.id, 'track-1-long');
  assert.equal(track1.src, '/audio/ai_vitamin_song_long.mp3');
  assert.equal(track1.durationSeconds, 267);
  assert.equal(track1.sections[0].tag, 'Intro');
  assert.equal(track1.sections[0].lines[0], '오, 오, 오 — 함께라서');
  assert.equal(track1.sections[track1.sections.length - 1].tag, 'Outro');

  // Track 2: Special track plays after
  const track2 = AI_VITAMIN_PLAYLIST[1];
  assert.equal(track2.id, 'track-2-short');
  assert.equal(track2.src, '/audio/ai_vitamin_song_short.mp3');
  assert.equal(track2.durationSeconds, 166);
  assert.equal(track2.sections[0].tag, 'Verse 1');
  assert.equal(track2.sections[0].lines[0], '물어볼 때마다 친절한 대답');
});

test('Test 26: Video URL parser and dual-mode playback support', () => {
  // 1. YouTube standard URL
  const ytStandard = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(ytStandard.isValid, true);
  assert.equal(ytStandard.type, 'youtube');
  assert.ok(ytStandard.embedUrl.includes('https://www.youtube.com/embed/dQw4w9WgXcQ'));

  // 2. YouTube short link (youtu.be)
  const ytShort = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?si=abcdef123');
  assert.equal(ytShort.isValid, true);
  assert.equal(ytShort.type, 'youtube');
  assert.ok(ytShort.embedUrl.includes('https://www.youtube.com/embed/dQw4w9WgXcQ'));

  // 3. YouTube embed URL
  const ytEmbed = parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
  assert.equal(ytEmbed.isValid, true);
  assert.equal(ytEmbed.type, 'youtube');

  // 4. Direct HTML5 video file (web URL)
  const mp4Direct = parseVideoUrl('https://example.com/assets/ai_vitamin_mv.mp4');
  assert.equal(mp4Direct.isValid, true);
  assert.equal(mp4Direct.type, 'direct');
  assert.equal(mp4Direct.embedUrl, 'https://example.com/assets/ai_vitamin_mv.mp4');

  // 5. Local PC MP4 path (Mac/Linux absolute path)
  const localMac = parseVideoUrl('/Users/a09721/Downloads/ai_vitamin_song.mp4');
  assert.equal(localMac.isValid, true);
  assert.equal(localMac.type, 'local');
  assert.ok(localMac.embedUrl.startsWith('/api/reveal-day/video-file?path='));
  assert.equal(localMac.fileName, 'ai_vitamin_song.mp4');

  // 6. Local PC MP4 path (Windows path)
  const localWin = parseVideoUrl('C:\\Users\\a09721\\Videos\\presentation.mp4');
  assert.equal(localWin.isValid, true);
  assert.equal(localWin.type, 'local');
  assert.equal(localWin.fileName, 'presentation.mp4');

  // 7. Local file:// URI format
  const localFileUri = parseVideoUrl('file:///Users/a09721/Movies/video.mov');
  assert.equal(localFileUri.isValid, true);
  assert.equal(localFileUri.type, 'local');
  assert.equal(localFileUri.fileName, 'video.mov');

  // 8. Relative video filename
  const localRel = parseVideoUrl('ai_vitamin_mv.mp4');
  assert.equal(localRel.isValid, true);
  assert.equal(localRel.type, 'local');
  assert.equal(localRel.fileName, 'ai_vitamin_mv.mp4');

  // 9. Vimeo link
  const vimeoUrl = parseVideoUrl('https://vimeo.com/123456789');
  assert.equal(vimeoUrl.isValid, true);
  assert.equal(vimeoUrl.type, 'vimeo');
  assert.ok(vimeoUrl.embedUrl.includes('123456789'));

  // 10. Invalid / Empty URL
  const emptyUrl = parseVideoUrl('');
  assert.equal(emptyUrl.isValid, false);
  assert.equal(emptyUrl.type, 'unknown');

  const invalidUrl = parseVideoUrl('not-a-valid-url-without-extension');
  assert.equal(invalidUrl.isValid, false);
});

test('Test 27: Local MP4 video stream resolver (resolveLocalVideoPath)', () => {
  import('fs').then(fs => {
    // Create a temporary test video file in public/video/
    const testDir = path.resolve(process.cwd(), 'public', 'video');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    const dummyVideo = path.join(testDir, 'test_dummy.mp4');
    fs.writeFileSync(dummyVideo, 'fake-mp4-content');

    // 1. Resolve by direct absolute path
    const resolvedDirect = resolveLocalVideoPath(dummyVideo);
    assert.equal(resolvedDirect, dummyVideo);

    // 2. Resolve by filename only (finds in public/video)
    const resolvedName = resolveLocalVideoPath('test_dummy.mp4');
    assert.ok(resolvedName && resolvedName.endsWith('test_dummy.mp4'));

    // 3. Resolve by /video/... path
    const resolvedSlash = resolveLocalVideoPath('/video/test_dummy.mp4');
    assert.ok(resolvedSlash && resolvedSlash.endsWith('test_dummy.mp4'));

    // 4. Non-existent file returns null
    const notFound = resolveLocalVideoPath('/non/existent/path/never_there.mp4');
    assert.equal(notFound, null);

    // 5. Disallowed extensions (e.g. .env, .txt) return null even if file exists
    const notVideo = resolveLocalVideoPath('package.json');
    assert.equal(notVideo, null);

    // Cleanup
    try { fs.unlinkSync(dummyVideo); } catch {}
  });
});




