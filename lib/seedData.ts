import { User, PraiseMessage, PrivateNote, MateAssignment } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'user-01', code: 'VIT-7F2A9', name: '김지현', team: '전략기획팀', avatar: '👩‍💼' },
  { id: 'user-02', code: 'VIT-8K3B1', name: '박서준', team: '마케팅팀', avatar: '👨‍💻' },
  { id: 'user-03', code: 'VIT-1M9C4', name: '최유진', team: '영업1팀', avatar: '👩‍🎨' },
  { id: 'user-04', code: 'VIT-4N2D8', name: '이민호', team: '서비스기획팀', avatar: '👨‍🏫' },
  { id: 'user-05', code: 'VIT-6P5E3', name: '정수아', team: '신사업개발팀', avatar: '👩‍🔬' },
  { id: 'user-06', code: 'VIT-3Q8F7', name: '강동원', team: '영업2팀', avatar: '👨‍💼' },
  { id: 'user-07', code: 'VIT-9R1G2', name: '윤아름', team: '전략기획팀', avatar: '👩‍💻' },
  { id: 'user-08', code: 'VIT-2S4H6', name: '조현우', team: '마케팅팀', avatar: '👨‍🔧' },
  { id: 'user-09', code: 'VIT-5T7I0', name: '임지민', team: '서비스기획팀', avatar: '👩‍💼' },
  { id: 'user-10', code: 'VIT-7U0J5', name: '한도현', team: '신사업개발팀', avatar: '👨‍🎓' },
  { id: 'user-11', code: 'VIT-8V3K9', name: '오세은', team: '영업1팀', avatar: '👩‍🏫' },
  { id: 'user-12', code: 'VIT-1W6L2', name: '서준혁', team: '영업2팀', avatar: '👨‍🎨' },
  { id: 'user-13', code: 'VIT-4X9M8', name: '신하은', team: '전략기획팀', avatar: '👩‍🔬' },
  { id: 'user-14', code: 'VIT-6Y2N1', name: '권우진', team: '마케팅팀', avatar: '👨‍💼' },
  { id: 'user-15', code: 'VIT-3Z5O4', name: '황보경', team: '서비스기획팀', avatar: '👩‍🔧' },
  { id: 'user-16', code: 'VIT-9A8P7', name: '송태섭', team: '신사업개발팀', avatar: '👨‍💻' },
  { id: 'user-17', code: 'VIT-2B1Q0', name: '전소미', team: '영업1팀', avatar: '👩‍🎓' },
  { id: 'user-18', code: 'VIT-5C4R3', name: '고재성', team: '영업2팀', avatar: '👨‍🏫' },
  { id: 'user-19', code: 'VIT-7D7S6', name: '문채원', team: '전략기획팀', avatar: '👩‍💼' },
  { id: 'user-20', code: 'VIT-8E0T9', name: '양지훈', team: '마케팅팀', avatar: '👨‍🎨' },
  { id: 'user-21', code: 'VIT-1F3U2', name: '배수지', team: '서비스기획팀', avatar: '👩‍💻' },
  { id: 'user-22', code: 'VIT-4G6V5', name: '노승범', team: '신사업개발팀', avatar: '👨‍🔬' },
  { id: 'user-23', code: 'VIT-6H9W8', name: '유다솜', team: '영업1팀', avatar: '👩‍💼' },
  { id: 'user-24', code: 'VIT-9I2X1', name: '홍길동', team: '영업2팀', avatar: '👨‍💼' },
  // 관리자 계정
  { id: 'admin-01', code: 'VIT-ADMIN', name: 'HT사업본부 관리자', team: '운영팀', avatar: '👑', role: 'admin' },
];

export const INITIAL_MATE_ASSIGNMENTS: MateAssignment[] = [
  { id: 'm-1', userId: 'user-01', targetUserId: 'user-02', assignedAt: '2026-09-01' },
  { id: 'm-2', userId: 'user-01', targetUserId: 'user-04', assignedAt: '2026-09-01' },
  { id: 'm-3', userId: 'user-02', targetUserId: 'user-01', assignedAt: '2026-09-01' },
  { id: 'm-4', userId: 'user-02', targetUserId: 'user-05', assignedAt: '2026-09-01' },
  { id: 'm-5', userId: 'user-03', targetUserId: 'user-01', assignedAt: '2026-09-01' },
  { id: 'm-6', userId: 'user-03', targetUserId: 'user-07', assignedAt: '2026-09-01' },
];

export const INITIAL_PRAISES: PraiseMessage[] = [
  {
    id: 'praise-1',
    senderUserId: 'user-02',
    recipientUserId: 'user-01',
    recipientName: '김지현',
    recipientTeam: '전략기획팀',
    content: '회의를 항상 명확하고 꼼꼼하게 정리해 주셔서 프로젝트 진행할 때 정말 큰 도움이 됩니다! 늘 감사합니다!',
    refinedContent: '회의를 항상 명확하고 꼼꼼하게 정리해 주셔서 프로젝트 진행할 때 정말 큰 도움이 됩니다! 늘 감사합니다!',
    likes: 12,
    likedBy: ['user-03', 'user-04', 'user-05'],
    createdAt: '2026-09-05T10:30:00Z',
    isMatePraise: true
  },
  {
    id: 'praise-2',
    senderUserId: 'user-03',
    recipientUserId: 'user-04',
    recipientName: '이민호',
    recipientTeam: '서비스기획팀',
    content: '바쁜 타팀 상황에서도 신속하고 친절하게 도와주시는 모습이 늘 인상적이었습니다. 팀 분위기가 밝아집니다!',
    refinedContent: '바쁜 타팀 상황에서도 신속하고 친절하게 도와주시는 모습이 늘 인상적이었습니다. 팀 분위기가 밝아집니다!',
    likes: 9,
    likedBy: ['user-01', 'user-02'],
    createdAt: '2026-09-06T14:20:00Z',
    isMatePraise: false
  },
  {
    id: 'praise-3',
    senderUserId: 'user-05',
    recipientUserId: 'user-06',
    recipientName: '강동원',
    recipientTeam: '영업2팀',
    content: '늘 긍정적인 에너지와 미소로 주위 동료들을 밝게 만들어 주셔서 감사합니다! 함께 일하면 큰 힘이 돼요.',
    refinedContent: '늘 긍정적인 에너지와 미소로 주위 동료들을 밝게 만들어 주셔서 감사합니다! 함께 일하면 큰 힘이 돼요.',
    likes: 15,
    likedBy: ['user-01', 'user-07', 'user-08'],
    createdAt: '2026-09-07T09:15:00Z',
    isMatePraise: true
  },
  {
    id: 'praise-4',
    senderUserId: 'user-07',
    recipientUserId: 'user-01',
    recipientName: '김지현',
    recipientTeam: '전략기획팀',
    content: '어려운 타 부서 협업 요청에도 적극적으로 경청해주시고 실행가능한 아이디어를 함께 찾아주셔서 진심으로 고맙습니다.',
    refinedContent: '어려운 타 부서 협업 요청에도 적극적으로 경청해주시고 실행가능한 아이디어를 함께 찾아주셔서 진심으로 고맙습니다.',
    likes: 7,
    likedBy: ['user-02'],
    createdAt: '2026-09-07T16:00:00Z',
    isMatePraise: false
  }
];

export const INITIAL_NOTES: PrivateNote[] = [
  {
    id: 'note-1',
    userId: 'user-01',
    targetUserId: 'user-02',
    content: '박서준님 마케팅 피치 자료 준비할 때 세심하게 비주얼 아이콘 챙기는 모습이 인상적임. 타팀 배려가 좋음.',
    updatedAt: '2026-09-04T11:00:00Z'
  },
  {
    id: 'note-2',
    userId: 'user-01',
    targetUserId: 'user-04',
    content: '이민호님 서비스기획안 브리핑할 때 경청하는 태도와 명확한 피드백 전달력이 뛰어남.',
    updatedAt: '2026-09-06T15:30:00Z'
  }
];
