import type { RevealTimeCapsuleItem, MatePairReveal, RevealCuratedItem, RevealPublicState } from './types';
import { INITIAL_USERS } from '../seedData';

// 24 actual active members from seedData (excluding admin)
const REAL_ATTENDEES = INITIAL_USERS.filter(u => u.role !== 'admin');

export const REHEARSAL_USERS = REAL_ATTENDEES.map((user, i) => {
  return {
    id: `rehearsal-user-${i + 1}`,
    name: user.name,
    team: user.team,
    avatar: user.avatar,
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
    [obs1, obs2].forEach((observer, obsSubIdx) => {
      const batchIndex = Math.floor(pairIdx / 8); // 6 batches of 8 relations
      // Realistic simulation: some attendees guessed their mate correctly for demo/rehearsal
      const isGuessed = (idx + obsSubIdx) % 3 === 0;
      pairs.push({
        id: `rehearsal-pair-${pairIdx + 1}`,
        batchIndex,
        observerId: observer.id,
        observerName: observer.name,
        observerTeam: observer.team,
        targetId: user.id,
        targetName: user.name,
        targetTeam: user.team,
        isRevealed: false,
        isGuessedCorrectly: isGuessed,
        isTargetCheckedIn: true
      });
      pairIdx++;
    });
  });
  return pairs;
})();

const REHEARSAL_CAPSULE_PROFILES: Array<{
  keywords: string[];
  analysis: string;
  letter: string;
}> = [
  // 1. 홍태영
  {
    keywords: ['리더십', '비전제시', '든든한버팀목', '신뢰', '동기부여'],
    analysis: '동료들은 홍태영 님을 복잡한 이슈 속에서도 명확한 방향을 제시하며 팀원들에게 흔들리지 않는 믿음과 용기를 불어넣는 든든한 조타수로 기억했습니다.',
    letter: '본부의 든든한 기둥으로서 언제나 넓은 시야와 따뜻한 배려로 팀원들을 이끌어 주신 덕분에 모두가 한마음으로 달릴 수 있었습니다. 함께한 모든 발걸음에 깊은 감사와 존경을 보냅니다.\n\n- AI Vitamin -'
  },
  // 2. 이은정
  {
    keywords: ['전략적통찰', '명쾌한기획', '팀워크', '배려심', '문제해결'],
    analysis: '동료들은 이은정 님을 치밀한 분석력과 날카로운 기획력으로 프로젝트의 길을 밝히고, 동료들의 사소한 부분까지 세심하게 살피는 따뜻한 전략가로 기억했습니다.',
    letter: '어려운 도전 과제 앞에서도 흔들림 없는 명쾌한 해법을 찾아내고, 늘 다정한 미소로 팀원들의 든든한 지원군이 되어주셔서 감사했습니다. 은정 님과 함께해서 늘 든든했습니다.\n\n- AI Vitamin -'
  },
  // 3. 박정호
  {
    keywords: ['기술해결사', '유쾌함', '긍정에너지', '적극성', '책임감'],
    analysis: '동료들은 박정호 님을 까다로운 기술적 난제도 막힘없이 풀어내는 뛰어난 역량과, 특유의 유쾌한 입담으로 팀 전체의 피로를 날려주는 비타민으로 기억했습니다.',
    letter: '어려운 순간마다 번뜩이는 아이디어와 기술력으로 든든한 돌파구가 되어주시고, 웃음을 잃지 않는 긍정 에너지로 팀에 활력을 채워주셔서 정말 고마웠습니다.\n\n- AI Vitamin -'
  },
  // 4. 이원용
  {
    keywords: ['치밀함', '완성도', '전문성', '신뢰의아이콘', '성실함'],
    analysis: '동료들은 이원용 님을 보이지 않는 디테일까지 놓치지 않는 철저함과 프로페셔널한 완성도로 프로젝트의 신뢰도를 한 차원 높여주는 핵심 주역으로 기억했습니다.',
    letter: '언제나 묵묵하면서도 완벽하게 본인의 몫을 해내시며 팀원들에게 최고의 롤모델이 되어주셨습니다. 원용 님의 성실함과 진심 어린 조언은 팀 전체의 큰 자산이었습니다.\n\n- AI Vitamin -'
  },
  // 5. 김유진
  {
    keywords: ['창의적아이디어', '센스', '팀분위기메이커', '열정', '친화력'],
    analysis: '동료들은 김유진 님을 틀에 갇히지 않은 반짝이는 발상과 감각적인 시각으로 팀에 새로운 영감을 불어넣고, 밝은 미소로 분위기를 화사하게 밝히는 활력소로 기억했습니다.',
    letter: '회의 시간마다 신선한 관점과 활발한 소통으로 활기를 불어넣어 주셔서 함께 일하는 시간이 늘 즐거웠습니다. 유진 님의 밝은 에너지는 우리 본부의 진짜 비타민이었습니다.\n\n- AI Vitamin -'
  },
  // 6. 김정수
  {
    keywords: ['온화한멘토', '경청', '배려', '깊은신뢰', '포용력'],
    analysis: '동료들은 김정수 님을 어떤 상황에서도 동료들의 목소리에 먼저 귀 기울여주고, 오랜 경험에서 우러나오는 따뜻한 조언으로 편안함을 주는 멘토로 기억했습니다.',
    letter: '조용히 다가와 건네주신 따뜻한 격려 한마디와 세심한 배려가 지친 팀원들에게 얼마나 큰 위로와 용기가 되었는지 모릅니다. 언제나 든든한 버팀목이 되어주셔서 진심으로 감사합니다.\n\n- AI Vitamin -'
  },
  // 7. 김진우
  {
    keywords: ['열정', '강력한추진력', '도전정신', '행동파', '돌파력'],
    analysis: '동료들은 김진우 님을 목표가 정해지면 거침없이 실행에 옮기는 과감한 행동력과, 실패를 두려워하지 않는 패기로 팀의 성장을 견인하는 개척자로 기억했습니다.',
    letter: '망설임 없이 앞장서서 장애물을 돌파해 주시는 열정적인 모습에 모든 팀원이 큰 자극과 추진력을 얻었습니다. 진우 님의 식지 않는 열정에 힘찬 박수를 보냅니다.\n\n- AI Vitamin -'
  },
  // 8. 마완준
  {
    keywords: ['묵묵한성실', '헌신', '조용한조력자', '우직함', '배려'],
    analysis: '동료들은 마완준 님을 화려하게 드러나지 않아도 팀이 필요로 하는 가장 중요한 자리를 묵묵히 지켜주며 궂은일도 솔선수범하는 진정한 히어로로 기억했습니다.',
    letter: '모두가 바쁘고 분주할 때에도 변함없는 자리에서 든든하게 받쳐주신 완준 님의 헌신과 성실함 덕분에 프로젝트가 단단하게 완성될 수 있었습니다. 깊은 감사를 전합니다.\n\n- AI Vitamin -'
  },
  // 9. 박병근
  {
    keywords: ['전략적안목', '위트', '중심축', '노련함', '유연한소통'],
    analysis: '동료들은 박병근 님을 핵심을 꿰뚫는 노련한 통찰력과 여유로운 유머 감각으로 팀의 긴장을 풀어주고 올바른 방향으로 중심을 잡아주는 든든한 동료로 기억했습니다.',
    letter: '급박한 상황에서도 특유의 차분함과 유쾌한 센스로 팀의 평정심을 지켜주신 병근 님 덕분에 많은 고비를 수월하게 넘길 수 있었습니다. 함께 일할 수 있어 든든했습니다.\n\n- AI Vitamin -'
  },
  // 10. 이상길
  {
    keywords: ['연륜과지혜', '다정함', '풍부한경험', '안정감', '화합'],
    analysis: '동료들은 이상길 님을 풍부한 실무 경험을 바탕으로 복잡한 문제도 부드럽게 매듭짓고, 따뜻한 인품으로 팀원들을 포근하게 아우르는 큰형 같은 존재로 기억했습니다.',
    letter: '언제 찾아가도 편안하게 맞아주시고 지혜로운 해답을 나눠주신 상길 님의 배려 덕분에 프로젝트 내내 큰 안정감을 느낄 수 있었습니다. 늘 베풀어주신 은혜에 감사드립니다.\n\n- AI Vitamin -'
  },
  // 11. 최종우
  {
    keywords: ['기민한대응', '솔선수범', '적극성', '끈기', '책임감'],
    analysis: '동료들은 최종우 님을 긴급한 요청에도 가장 먼저 두 팔 걷고 달려와 발 빠르게 대응하며, 맡은 일은 끝까지 책임지는 열혈 해결사로 기억했습니다.',
    letter: '어려운 부탁에도 망설임 없이 손을 내밀어 주시고, 팀의 성공을 위해 누구보다 부지런히 뛰어주신 종우 님의 성실함에 깊은 감동을 받았습니다. 앞으로도 함께 빛나길 응원합니다.\n\n- AI Vitamin -'
  },
  // 12. 추현지
  {
    keywords: ['섬세한소통', '힐링메이트', '공감능력', '꼼꼼함', '따뜻함'],
    analysis: '동료들은 추현지 님을 상대방의 마음을 깊이 헤아리는 다정한 공감 능력과 꼼꼼한 피드백으로, 함께 대화하는 것만으로도 마음에 힐링을 주는 온기 있는 동료로 기억했습니다.',
    letter: '바쁜 일상 속에서도 따뜻한 눈빛과 사려 깊은 대화로 팀원들의 마음을 보듬어 주셔서 감사했습니다. 현지 님이 계셨기에 팀의 온도가 한층 더 따뜻해질 수 있었습니다.\n\n- AI Vitamin -'
  },
  // 13. 김세진
  {
    keywords: ['글로벌감각', '열린소통', '새로운도전', '통섭', '스마트함'],
    analysis: '동료들은 김세진 님을 폭넓은 글로벌 시야와 유창한 소통 역량으로 새로운 사업 기회를 기민하게 포착하고 팀의 지평을 넓혀주는 스마트한 인재로 기억했습니다.',
    letter: '새로운 영역에 주저 없이 뛰어들며 우리 본부의 위상을 높여주신 세진 님의 탁월한 전문성과 친화력에 많은 감동을 받았습니다. 세진 님의 멋진 미래를 늘 응원합니다.\n\n- AI Vitamin -'
  },
  // 14. 양정희
  {
    keywords: ['포용적리더십', '명확한방향', '격려', '신뢰', '안정감'],
    analysis: '동료들은 양정희 님을 팀원 한 명 한 명의 강점을 살려주고 따뜻한 격려로 자율성을 북돋아 주며 안정감 있게 조직을 이끄는 포용력 있는 리더로 기억했습니다.',
    letter: '팀원들을 믿고 지지해 주시는 정희 님의 따뜻한 리더십 덕분에 지치지 않고 각자의 역량을 마음껏 펼칠 수 있었습니다. 보내주신 아낌없는 신뢰에 진심으로 감사드립니다.\n\n- AI Vitamin -'
  },
  // 15. 강성훈
  {
    keywords: ['번뜩이는센스', '쾌활함', '시너지창출', '협업의달인', '열정'],
    analysis: '동료들은 강성훈 님을 넘치는 에너지와 센스 넘치는 소통으로 부서 간의 벽을 허물고, 언제나 함께 일하고 싶은 긍정적인 파동을 일으키는 시너지 메이커로 기억했습니다.',
    letter: '언제나 유쾌하고 센스 넘치는 태도로 협업의 순간을 즐겁게 만들어 주시고, 팀의 활기를 책임져 주셔서 큰 힘이 되었습니다. 성훈 님과 함께해서 늘 든든하고 행복했습니다.\n\n- AI Vitamin -'
  },
  // 16. 김호인
  {
    keywords: ['정교한조율', '글로벌파트너십', '신뢰성', '침착함', '꼼꼼함'],
    analysis: '동료들은 김호인 님을 복잡한 글로벌 이해관계를 매끄럽게 조율하고 빈틈없는 준비로 대외 협력의 신뢰를 굳건히 다져주는 믿음직한 에이스로 기억했습니다.',
    letter: '어려운 협상과 조율의 순간마다 차분하고 빈틈없는 역량을 발휘해 주신 호인 님의 프로페셔널한 면모는 팀원 모두에게 큰 귀감이 되었습니다. 수고 많으셨습니다.\n\n- AI Vitamin -'
  },
  // 17. 마석현
  {
    keywords: ['끈기', '남다른실행력', '성장마인드', '성실함', '패기'],
    analysis: '동료들은 마석현 님을 어떤 어려운 과제가 주어져도 포기하지 않고 집요하게 파고들어 결국 해내고야 마는 열정적인 성장형 인재로 기억했습니다.',
    letter: '묵묵히 배우고 끊임없이 발전하며 놀라운 성과를 만들어내는 석현 님의 진취적인 열정에 깊은 인상을 받았습니다. 석현 님의 빛나는 성장을 앞으로도 힘차게 응원합니다.\n\n- AI Vitamin -'
  },
  // 18. 조재화
  {
    keywords: ['AX비전', '혁신선도', '통찰력', '잠재력발굴', '열정리더'],
    analysis: '동료들은 조재화 님을 AI 전환의 큰 그림을 명확히 제시하며 혁신을 이끌고, 팀원들의 숨은 잠재력을 이끌어내 주는 통찰력 있는 리더로 기억했습니다.',
    letter: '본부의 미래를 밝히는 혁신적인 비전과 아낌없는 격려로 팀을 이끌어 주신 재화 님 덕분에 모두가 두려움 없이 새로운 도전에 나설 수 있었습니다. 진심으로 감사드립니다.\n\n- AI Vitamin -'
  },
  // 19. 한승민
  {
    keywords: ['AI아키텍트', '핵심브레인', '문제해결', '기술전문성', '탐구열'],
    analysis: '동료들은 한승민 님을 복잡한 AI 아키텍처와 기술적 과제를 명쾌하게 정리하고 언제나 한발 앞서 해답을 제시해 주는 본부의 든든한 기술 기둥으로 기억했습니다.',
    letter: '어려운 기술적 질문에도 늘 친절하고 명쾌하게 길을 짚어주시고, 본부의 AI 역량을 한 단계 끌어올려 주신 승민 님의 전문성에 깊은 감사를 드립니다.\n\n- AI Vitamin -'
  },
  // 20. 조상현
  {
    keywords: ['완벽한디테일', '테크니컬센스', '책임감', '꼼꼼함', '조력'],
    analysis: '동료들은 조상현 님을 정교한 설계와 디테일에 대한 집념으로 결과물의 완성도를 극대화하고, 팀원들의 든든한 테크니컬 파트너가 되어주는 동료로 기억했습니다.',
    letter: '작은 오차도 놓치지 않는 상현 님의 꼼꼼한 시선과 책임감 덕분에 프로젝트의 완성도가 완벽해질 수 있었습니다. 언제나 함께해 주셔서 감사했습니다.\n\n- AI Vitamin -'
  },
  // 21. 박한주
  {
    keywords: ['협업의가교', '친화력', '원활한소통', '배려심', '긍정적태도'],
    analysis: '동료들은 박한주 님을 부서 간의 의견을 부드럽게 조율하고 상대방을 편안하게 해주는 뛰어난 유대감으로 팀워크를 최고로 끌어올리는 소통의 달인으로 기억했습니다.',
    letter: '다양한 이해관계 속에서도 항상 상대방의 입장을 먼저 배려하며 원활한 합의점을 이끌어내 주신 한주 님의 따뜻한 커뮤니케이션에 깊은 감사를 전합니다.\n\n- AI Vitamin -'
  },
  // 22. 강태형
  {
    keywords: ['러닝챔피언', '신기술탐구', '아낌없는공유', '열정', '적극성'],
    analysis: '동료들은 강태형 님을 끊임없이 새로운 최신 AI 기술을 흡수하고 이를 팀에 아낌없이 나누며 팀 전체의 학습과 성장을 이끄는 지식 나눔이로 기억했습니다.',
    letter: '새로운 기술 트렌드를 빠르게 파악하여 팀에 공유해 주시고 늘 배움에 대한 뜨거운 열정을 보여주신 태형 님 덕분에 팀 전체가 함께 성장할 수 있었습니다.\n\n- AI Vitamin -'
  },
  // 23. 조진영
  {
    keywords: ['밝은미소', '긍정메이커', '팀의활력', '따뜻한배려', '친절함'],
    analysis: '동료들은 조진영 님을 힘든 일정 속에서도 늘 밝은 미소와 긍정적인 한마디로 팀원들에게 큰 힘과 위로를 건네주는 사랑받는 분위기 메이커로 기억했습니다.',
    letter: '진영 님의 밝은 인사와 세심한 배려 덕분에 사무실에 들어설 때마다 기분 좋은 에너지를 얻을 수 있었습니다. 변함없는 따뜻함으로 함께해 주셔서 감사합니다.\n\n- AI Vitamin -'
  },
  // 24. 허성훈
  {
    keywords: ['뚝심', '믿음직한실행', '현장해결사', '성실함', '의리'],
    analysis: '동료들은 허성훈 님을 어떤 난관이 닥쳐도 뚝심 있게 자리를 지키며 행동으로 결과를 증명해 내는 듬직하고 신뢰감 넘치는 든든한 동료로 기억했습니다.',
    letter: '위기 때마다 든든하게 앞장서서 현장의 문제를 해결해 주시고, 묵묵한 신뢰로 팀을 지켜주신 성훈 님의 헌신적인 노고에 온 마음을 담아 감사드립니다.\n\n- AI Vitamin -'
  }
];

export const REHEARSAL_TIME_CAPSULES: RevealTimeCapsuleItem[] = REHEARSAL_USERS.map((user, i) => {
  const profile = REHEARSAL_CAPSULE_PROFILES[i % REHEARSAL_CAPSULE_PROFILES.length];
  return {
    id: `rehearsal-capsule-${i + 1}`,
    userId: user.id,
    recipientName: user.name,
    recipientTeam: user.team,
    keywords: profile.keywords,
    analysis: profile.analysis,
    letter: profile.letter,
    approvalStatus: 'approved',
    sourceHash: `hash-rehearsal-${i + 1}`,
    isSpotlight: true,
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
    currentCapsuleIndex: 0,
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
