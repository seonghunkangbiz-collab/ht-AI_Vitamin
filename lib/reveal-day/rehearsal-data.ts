import type { RevealTimeCapsuleItem, MatePairReveal, RevealCuratedItem, RevealPublicState } from './types';

export const REHEARSAL_USERS = Array.from({ length: 24 }).map((_, i) => {
  const char = String.fromCharCode(65 + i); // A, B, C...
  const team = i < 8 ? '전략사업개발팀' : i < 16 ? 'Global사업개발팀' : 'AX 사업개발팀';
  const avatars = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🎨', '👨‍🏫', '👨‍🎓'];
  return {
    id: `rehearsal-user-${i + 1}`,
    name: `구성원 ${char}`,
    team,
    avatar: avatars[i % avatars.length],
    role: 'user' as const
  };
});

export const REHEARSAL_MATE_PAIRS: MatePairReveal[] = (() => {
  const pairs: MatePairReveal[] = [];
  let pairIdx = 0;
  REHEARSAL_USERS.forEach((user, idx) => {
    // 2 observers for each target
    const obs1 = REHEARSAL_USERS[(idx + 7) % 24];
    const obs2 = REHEARSAL_USERS[(idx + 13) % 24];
    [obs1, obs2].forEach((observer) => {
      const batchIndex = Math.floor(pairIdx / 8); // 6 batches of 8 relations
      pairs.push({
        id: `rehearsal-pair-${pairIdx + 1}`,
        batchIndex,
        observerId: observer.id,
        observerName: observer.name,
        observerTeam: observer.team,
        targetId: user.id,
        targetName: user.name,
        targetTeam: user.team,
        isRevealed: false
      });
      pairIdx++;
    });
  });
  return pairs;
})();

export const REHEARSAL_TIME_CAPSULES: RevealTimeCapsuleItem[] = REHEARSAL_USERS.map((user, i) => {
  const keywordSets = [
    ['협업', '적극성', '책임감', '배려심', '긍정에너지'],
    ['문제해결', '신뢰', '소통', '열정', '포용력'],
    ['전문성', '꼼꼼함', '조력자', '도전정신', '유쾌함']
  ];
  return {
    id: `rehearsal-capsule-${i + 1}`,
    userId: user.id,
    recipientName: user.name,
    recipientTeam: user.team,
    keywords: keywordSets[i % keywordSets.length],
    analysis: `동료들은 ${user.name}님을 늘 묵묵히 팀을 든든하게 받쳐주고 밝은 웃음으로 활력을 불어넣는 따뜻한 조력자로 기억했습니다.`,
    letter: `지난 두 달 동안 함께한 시간 속에서 ${user.name}님이 보여주신 진심과 배려는 모든 팀원들에게 큰 힘이 되었습니다. 함께 성장할 수 있어 감사했습니다.\n\n- AI Vitamin -`,
    approvalStatus: 'approved',
    sourceHash: `hash-rehearsal-${i + 1}`,
    isSpotlight: i % 4 === 0,
    generationMethod: 'fallback',
    reviewedBy: '관리자',
    reviewedAt: '2026-10-28T14:00:00+09:00',
    createdAt: '2026-10-28T14:00:00+09:00'
  };
});

export const REHEARSAL_CURATED_ITEMS: RevealCuratedItem[] = [
  {
    id: 'curated-r-1',
    eventId: 'event-rehearsal',
    itemType: 'praise_quote',
    content: '복잡한 이슈 속에서도 항상 침착하고 긍정적인 태도로 해결책을 이끌어 주셔서 큰 귀감이 되었습니다.',
    anonymousLabel: '익명의 비타민',
    safeToPresent: true,
    approvalStatus: 'approved',
    sortOrder: 1,
    createdAt: '2026-10-28T14:00:00+09:00'
  },
  {
    id: 'curated-r-2',
    eventId: 'event-rehearsal',
    itemType: 'praise_quote',
    content: '다른 팀의 긴급한 지원 요청에도 두 팔 걷고 나서주시는 배려에 깊은 감동을 받았습니다.',
    anonymousLabel: '동료 비타민',
    safeToPresent: true,
    approvalStatus: 'approved',
    sortOrder: 2,
    createdAt: '2026-10-28T14:00:00+09:00'
  },
  {
    id: 'curated-r-3',
    eventId: 'event-rehearsal',
    itemType: 'keyword',
    content: '협업과 신뢰',
    safeToPresent: true,
    approvalStatus: 'approved',
    sortOrder: 3,
    createdAt: '2026-10-28T14:00:00+09:00'
  },
  {
    id: 'curated-r-4',
    eventId: 'event-rehearsal',
    itemType: 'episode',
    content: '새벽까지 이어진 프로젝트 런칭 날, 모두가 지쳤을 때 따뜻한 격려 커피를 조용히 놓아두신 미담이 있었습니다.',
    anonymousLabel: '따뜻한 관찰자',
    safeToPresent: true,
    approvalStatus: 'approved',
    sortOrder: 4,
    createdAt: '2026-10-28T14:00:00+09:00'
  }
];

export const REHEARSAL_PRIZES = [
  { round: 1, name: '1등: 소니 노이즈캔슬링 프리미엄 헤드폰', count: 1 },
  { round: 2, name: '2등: 신세계 백화점 상품권 10만원권', count: 2 },
  { round: 3, name: '3등: 배달의민족 상품권 5만원권', count: 3 },
  { round: 4, name: '특별상: 스타벅스 e카드 3만원권', count: 5 }
];

export function getRehearsalPublicState(): RevealPublicState {
  return {
    eventId: 'event-rehearsal',
    mode: 'rehearsal',
    status: 'ready',
    currentSegment: 'opening',
    currentRevealIndex: 0,
    currentBatchIndex: 0,
    revealedPairsCount: 0,
    dataVersion: 1,
    sequence: 1,
    isBlackout: false,
    isHolding: false,
    reactionCounts: {
      heart: 12,
      clap: 24,
      party: 18,
      sparkle: 15,
      fire: 8
    },
    checkinCount: 24,
    lastDataSyncAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getRehearsalSnapshot() {
  return {
    totalUsers: 24,
    totalPraises: 39,
    recentPraises7d: 14,
    totalNotes: 3,
    wallViews: 118,
    teamBreakdown: {
      '전략사업개발팀': { praiseGiven: 18, praiseReceived: 17, userCount: 8 },
      'Global사업개발팀': { praiseGiven: 12, praiseReceived: 13, userCount: 8 },
      'AX 사업개발팀': { praiseGiven: 9, praiseReceived: 9, userCount: 8 }
    },
    approvedMessages: REHEARSAL_CURATED_ITEMS.filter(c => c.itemType === 'praise_quote').map(c => c.content),
    topKeywords: ['협업', '신뢰', '긍정에너지', '적극성', '책임감']
  };
}
