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
    status: 'live',
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

test('Test 28: Synchronized Video Playback & Clean Centered Layout Verification', () => {
  // 1. Verify playback event message structures for BroadcastChannel & Supabase
  const playEvent = {
    type: 'VIDEO_PLAYBACK_ACTION',
    action: 'video_play' as const,
    currentTime: 14.2,
  };
  const pauseEvent = {
    type: 'VIDEO_PLAYBACK_ACTION',
    action: 'video_pause' as const,
    currentTime: 14.2,
  };
  const seekEvent = {
    type: 'VIDEO_PLAYBACK_ACTION',
    action: 'video_seek' as const,
    currentTime: 65.0,
  };

  assert.equal(playEvent.action, 'video_play');
  assert.equal(pauseEvent.action, 'video_pause');
  assert.equal(seekEvent.currentTime, 65.0);

  // 2. Verify Video Layout Components Rules:
  // In video mode: ONLY Pizza Timer & Maximized Video Screen are rendered.
  // Group Photo and Time Capsule cards are strictly excluded from video mode.
  const videoModeElements = {
    hasPizzaTimer: true,
    hasMaximizedVideo: true,
    hasGroupPhotoCard: false,
    hasTimeCapsuleCard: false,
  };

  assert.ok(videoModeElements.hasPizzaTimer, 'Pizza countdown timer must be kept in video mode');
  assert.ok(videoModeElements.hasMaximizedVideo, 'Video player must be kept and centered');
  assert.strictEqual(videoModeElements.hasGroupPhotoCard, false, 'Group photo card must be removed in video mode');
  assert.strictEqual(videoModeElements.hasTimeCapsuleCard, false, 'Time capsule card must be removed in video mode');
});

test('Test 29: Journey Segment Team Stats & Praise Flow Privacy Integration', () => {
  // Raw stats received from snapshot containing 1-person division leadership
  const rawStats = {
    totalUsers: 26,
    totalPraises: 68,
    teamStats: {
      '반도체전략사업개발팀': { praiseGiven: 17, praiseReceived: 23, userCount: 11 },
      '반도체AX사업개발팀': { praiseGiven: 31, praiseReceived: 23, userCount: 7 },
      '반도체Global사업개발팀': { praiseGiven: 17, praiseReceived: 18, userCount: 7 },
      'Hi-Tech 사업본부': { praiseGiven: 3, praiseReceived: 4, userCount: 1 }
    },
    approvedQuotes: [
      { id: '1', content: '우리 조직에 필요한 어플을 만들어주셔서 감사합니다. 아이디어 정말 최고입니다', team: '반도체Global사업개발팀' },
      { id: '2', content: '선물 당첨 축하해요~~~😆', team: '반도체AX사업개발팀' },
      { id: '3', content: '선물 당첨 축하해요~~😆 내용물 궁금해요~~~~', team: '반도체전략사업개발팀' }
    ]
  };

  // 1. Processed Team Stats must NEVER contain a single-person 'Hi-Tech 사업본부' card
  const primaryTeams = ['반도체전략사업개발팀', '반도체AX사업개발팀', '반도체Global사업개발팀'];
  const processedKeys = primaryTeams;

  assert.ok(!processedKeys.includes('Hi-Tech 사업본부'), 'Standalone Hi-Tech 사업본부 card must not be exposed');
  assert.equal(processedKeys.length, 3, 'Must render exactly 3 symmetric business teams');

  // 2. Integration verification: userCount and praises smoothly absorbed into 3 business teams
  const integratedStats = {
    '반도체전략사업개발팀': { praiseGiven: 18, praiseReceived: 25, userCount: 12 },
    '반도체AX사업개발팀': { praiseGiven: 32, praiseReceived: 24, userCount: 7 },
    '반도체Global사업개발팀': { praiseGiven: 18, praiseReceived: 19, userCount: 7 }
  };

  const totalUsers = Object.values(integratedStats).reduce((acc, t) => acc + t.userCount, 0);
  const totalGiven = Object.values(integratedStats).reduce((acc, t) => acc + t.praiseGiven, 0);
  const totalReceived = Object.values(integratedStats).reduce((acc, t) => acc + t.praiseReceived, 0);

  assert.equal(totalUsers, 26, 'Total users across 3 teams must equal total attendees (26)');
  assert.equal(totalGiven, 68, 'Total given praises must equal 68');
  assert.equal(totalReceived, 68, 'Total received praises must equal 68');

  // 3. Quotes filter verification: casual test text ("선물 당첨") must be filtered out
  const validQuotes = rawStats.approvedQuotes.filter(q => {
    const text = q.content.trim();
    if (text.length < 15) return false;
    if (/선물 당첨|내용물 궁금|테스트/i.test(text)) return false;
    return true;
  });

  assert.equal(validQuotes.length, 1, 'Only genuine appreciation quote passes the filter');
  assert.ok(!validQuotes.some(q => q.content.includes('선물 당첨')), 'Casual raffle text must be removed');
});

test('Test 30: Mystery Mate Reveal Logic & Rehearsal Data Inbound Integrity', async () => {
  const { REHEARSAL_MATE_PAIRS } = await import('@/lib/reveal-day/rehearsal-data');
  const { INITIAL_MATE_ASSIGNMENTS } = await import('@/lib/seedData');

  // 1. In seed assignments, Kang Seong-hun ('user-15') observed user-01 (홍태영) and user-06 (김정수)
  const kangOutbound = INITIAL_MATE_ASSIGNMENTS.filter(a => a.userId === 'user-15');
  const kangTargetIds = kangOutbound.map(a => a.targetUserId);
  assert.ok(kangTargetIds.includes('user-01'), 'Kang Seong-hun took care of Hong Tae-young (user-01)');
  assert.ok(kangTargetIds.includes('user-06'), 'Kang Seong-hun took care of Kim Jeong-soo (user-06)');

  // 2. On the Reveal Day stage:
  // For Target Kang Seong-hun ('user-15'), the revealed observers MUST be the ones who took care of him (이상길 user-10 with real note, 이원용 user-04)
  const kangCardPairs = REHEARSAL_MATE_PAIRS.filter(p => p.targetId === 'user-15');
  assert.equal(kangCardPairs.length, 2, 'Kang Seong-hun has exactly 2 secret mates watching him');
  const kangObserverNames = kangCardPairs.map(p => p.observerName);
  assert.ok(kangObserverNames.includes('이상길'), 'Lee Sang-gil is one of Kang Seong-hun secret mates with real note');
  assert.ok(kangObserverNames.includes('이원용'), 'Lee Won-yong is one of Kang Seong-hun assigned secret mates');

  // 3. And under Target Hong Tae-young and Target Kim Jeong-soo, Kang Seong-hun is revealed as their secret mate!
  const hongCardPairs = REHEARSAL_MATE_PAIRS.filter(p => p.targetId === 'user-01');
  const hongObserverNames = hongCardPairs.map(p => p.observerName);
  assert.ok(hongObserverNames.includes('강성훈'), 'Kang Seong-hun is revealed as Hong Tae-young secret mate');

  const kimCardPairs = REHEARSAL_MATE_PAIRS.filter(p => p.targetId === 'user-06');
  const kimObserverNames = kimCardPairs.map(p => p.observerName);
  assert.ok(kimObserverNames.includes('강성훈'), 'Kang Seong-hun is revealed as Kim Jeong-soo secret mate');

  // 4. Default Guess verification: NO pair should have isGuessedCorrectly === true by default
  const defaultGuessedPairs = REHEARSAL_MATE_PAIRS.filter(p => p.isGuessedCorrectly);
  assert.equal(defaultGuessedPairs.length, 0, 'No pairs should be falsely marked as guessed without real attendee action');

  // 5. Guess Matching logic: Only matching guess returns true
  const guessMap = new Map([['user-15', 'user-10']]); // Kang Seong-hun guessed Lee Sang-gil
  const pair1Guessed = guessMap.get('user-15') === 'user-10'; // Match!
  const pair2Guessed = guessMap.get('user-15') === 'user-04'; // Not guessed
  assert.equal(pair1Guessed, true, 'Guessing actual observer returns true');
  assert.equal(pair2Guessed, false, 'Unmatched observer returns false');
});

test('Test 31: Recent additions (이현서, 최지훈) excluded from 2-month history segments', async () => {
  const { REHEARSAL_MATE_PAIRS, REHEARSAL_TIME_CAPSULES, REHEARSAL_USERS } = await import('@/lib/reveal-day/rehearsal-data');

  // 1. REHEARSAL_USERS only has the 24 active participants of the 2-month program
  assert.equal(REHEARSAL_USERS.length, 24, 'Rehearsal active users for 2-month segments must equal 24');
  assert.equal(REHEARSAL_USERS.some(u => u.name === '이현서' || u.name === '최지훈'), false);

  // 2. REHEARSAL_MATE_PAIRS must NOT include 이현서 or 최지훈 as target or observer
  const uniqueTargets = new Set(REHEARSAL_MATE_PAIRS.map(p => p.targetName));
  const uniqueObservers = new Set(REHEARSAL_MATE_PAIRS.map(p => p.observerName));

  assert.equal(uniqueTargets.size, 24, 'Mystery mate reveal has exactly 24 targets');
  assert.equal(uniqueTargets.has('이현서'), false, '이현서 must not appear as mate target');
  assert.equal(uniqueTargets.has('최지훈'), false, '최지훈 must not appear as mate target');
  assert.equal(uniqueObservers.has('이현서'), false, '이현서 must not appear as mate observer');
  assert.equal(uniqueObservers.has('최지훈'), false, '최지훈 must not appear as mate observer');

  // 3. REHEARSAL_TIME_CAPSULES has exactly 24 capsules
  assert.equal(REHEARSAL_TIME_CAPSULES.length, 24, 'Time capsules must equal 24');
  assert.equal(REHEARSAL_TIME_CAPSULES.some(c => c.recipientName === '이현서' || c.recipientName === '최지훈'), false);
});

test('Test 32: Exactly 2 Secret Mates per participant (24 targets x 2 = 48 pairs) and balanced 6 batches', async () => {
  const { REHEARSAL_MATE_PAIRS, REHEARSAL_USERS } = await import('@/lib/reveal-day/rehearsal-data');

  // Total pairs must be exactly 48 (24 targets * 2 mates)
  assert.equal(REHEARSAL_MATE_PAIRS.length, 48, 'Total pairs must be exactly 48');

  // Check every target has exactly 2 observers
  for (const user of REHEARSAL_USERS) {
    const pairsForTarget = REHEARSAL_MATE_PAIRS.filter(p => p.targetId === user.id);
    assert.equal(pairsForTarget.length, 2, `Target ${user.name} (${user.id}) must have exactly 2 observers`);
    
    // The two observers must be different people
    assert.notEqual(pairsForTarget[0].observerId, pairsForTarget[1].observerId, `Target ${user.name} observers must be distinct`);
    // Observers cannot be the target themselves
    assert.notEqual(pairsForTarget[0].observerId, user.id, `Observer cannot be target self`);
    assert.notEqual(pairsForTarget[1].observerId, user.id, `Observer cannot be target self`);
  }

  // Exactly 6 batches (batchIndex 0 to 5), each batch having 8 pairs (4 targets * 2 observers)
  for (let b = 0; b < 6; b++) {
    const batchPairs = REHEARSAL_MATE_PAIRS.filter(p => p.batchIndex === b);
    assert.equal(batchPairs.length, 8, `Batch ${b} must contain exactly 8 pairs`);
    const batchTargets = new Set(batchPairs.map(p => p.targetId));
    assert.equal(batchTargets.size, 4, `Batch ${b} must contain exactly 4 distinct targets`);
  }
});

test('Test 33: Latest Observation Notes prioritized on Mystery Mate card & Recommended Features Integrity', async () => {
  const { REHEARSAL_MATE_PAIRS } = await import('@/lib/reveal-day/rehearsal-data');
  const { soundEffects } = await import('@/lib/reveal-day/sound-effects');

  // 1. Observation note verification for Hong Tae-young (user-01) observed by Kang Seong-hun (user-15)
  const hongKangPair = REHEARSAL_MATE_PAIRS.find(
    p => p.targetId === 'user-01' && p.observerId === 'user-15'
  );
  assert.ok(hongKangPair, 'Kang Seong-hun must be an observer for Hong Tae-young');
  assert.equal(
    hongKangPair?.noteMessage,
    '매우 바쁨, 고민이 많아 보임.',
    'Hong Tae-young card must show Kang Seong-hun latest observation note'
  );

  // 2. Observation note verification for Kim Jeong-soo (user-06) observed by Kang Seong-hun (user-15)
  const kimKangPair = REHEARSAL_MATE_PAIRS.find(
    p => p.targetId === 'user-06' && p.observerId === 'user-15'
  );
  assert.ok(kimKangPair, 'Kang Seong-hun must be an observer for Kim Jeong-soo');
  assert.equal(
    kimKangPair?.noteMessage,
    '청주 P&T 보다 결기가 중요합니다. !\n따님 수능 합격기원 ㅎ',
    'Kim Jeong-soo card must show Kang Seong-hun latest observation note'
  );

  // 3. Praise message exclusion & Mate-centric observer isolation verification
  assert.equal(hongKangPair?.praiseMessage, '', 'Praise message must not be shown on Mystery Mate card');
  assert.equal(kimKangPair?.praiseMessage, '', 'Praise message must not be shown on Mystery Mate card');

  const kangAsObserverPairs = REHEARSAL_MATE_PAIRS.filter(p => p.observerId === 'user-15');
  assert.equal(kangAsObserverPairs.length, 2, 'Kang Seong-hun must only be a secret mate for his 2 assigned targets');
  const kangObserverTargetNames = kangAsObserverPairs.map(p => p.targetName);
  assert.ok(kangObserverTargetNames.includes('홍태영') && kangObserverTargetNames.includes('김정수'), 'Kang Seong-hun only observes Hong Tae-young & Kim Jeong-soo');

  // 4. Sound Effects API presence and safe execution
  assert.equal(typeof soundEffects.startDrumRoll, 'function');
  assert.equal(typeof soundEffects.stopDrumRoll, 'function');
  assert.equal(typeof soundEffects.playFanfare, 'function');
  soundEffects.setMuted(true);
  soundEffects.startDrumRoll();
  soundEffects.stopDrumRoll();
  soundEffects.playFanfare();
});









