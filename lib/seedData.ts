import type { User, PraiseMessage, PrivateNote, MateAssignment } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'user-01', code: 'VIT-7F2A9', name: '홍태영', team: 'Hi-Tech 사업본부', avatar: '👨‍💼', employeeNumber: '01217' },
  { id: 'user-02', code: 'VIT-8K3B1', name: '이은정', team: '전략사업개발팀', avatar: '👩‍💼', employeeNumber: '09150' },
  { id: 'user-03', code: 'VIT-1M9C4', name: '박정호', team: '전략사업개발팀', avatar: '👨‍💻', employeeNumber: '06261' },
  { id: 'user-04', code: 'VIT-4N2D8', name: '이원용', team: '전략사업개발팀', avatar: '👨‍🔬', employeeNumber: '11523' },
  { id: 'user-05', code: 'VIT-6P5E3', name: '김유진', team: '전략사업개발팀', avatar: '👩‍🎨', employeeNumber: '10236' },
  { id: 'user-06', code: 'VIT-3Q8F7', name: '김정수', team: '전략사업개발팀', avatar: '👨‍🏫', employeeNumber: '10996' },
  { id: 'user-07', code: 'VIT-9R1G2', name: '김진우', team: '전략사업개발팀', avatar: '👨‍💻', employeeNumber: '10511' },
  { id: 'user-08', code: 'VIT-2S4H6', name: '마완준', team: '전략사업개발팀', avatar: '👨‍🔧', employeeNumber: '11736' },
  { id: 'user-09', code: 'VIT-5T7I0', name: '박병근', team: '전략사업개발팀', avatar: '👨‍💼', employeeNumber: '07388' },
  { id: 'user-10', code: 'VIT-7U0J5', name: '이상길', team: '전략사업개발팀', avatar: '👨‍🎓', employeeNumber: '03378' },
  { id: 'user-11', code: 'VIT-8V3K9', name: '최종우', team: '전략사업개발팀', avatar: '👨‍💻', employeeNumber: '09441' },
  { id: 'user-12', code: 'VIT-1W6L2', name: '추현지', team: '전략사업개발팀', avatar: '👩‍💻', employeeNumber: '11145' },
  { id: 'user-13', code: 'VIT-4X9M8', name: '김세진', team: 'Global사업개발팀', avatar: '👩‍🔬', employeeNumber: '10444' },
  { id: 'user-14', code: 'VIT-6Y2N1', name: '양정희', team: 'Global사업개발팀', avatar: '👩‍💼', employeeNumber: '10004' },
  { id: 'user-15', code: 'VIT-3Z5O4', name: '강성훈', team: 'Global사업개발팀', avatar: '👨‍💼', employeeNumber: '09721' },
  { id: 'user-16', code: 'VIT-9A8P7', name: '김호인', team: 'Global사업개발팀', avatar: '👨‍💻', employeeNumber: '09520' },
  { id: 'user-17', code: 'VIT-2B1Q0', name: '마석현', team: 'Global사업개발팀', avatar: '👨‍🎓', employeeNumber: '11792' },
  { id: 'user-18', code: 'VIT-5C4R3', name: '조재화', team: 'AX 사업개발팀', avatar: '👨‍🏫', employeeNumber: '04422' },
  { id: 'user-19', code: 'VIT-7D7S6', name: '한승민', team: 'AX 사업개발팀', avatar: '👨‍💻', employeeNumber: '07796' },
  { id: 'user-20', code: 'VIT-8E0T9', name: '조상현', team: 'AX 사업개발팀', avatar: '👨‍🎨', employeeNumber: '09891' },
  { id: 'user-21', code: 'VIT-1F3U2', name: '박한주', team: 'AX 사업개발팀', avatar: '👨‍💼', employeeNumber: '09277' },
  { id: 'user-22', code: 'VIT-4G6V5', name: '강태형', team: 'AX 사업개발팀', avatar: '👨‍🔬', employeeNumber: '10326' },
  { id: 'user-23', code: 'VIT-6H9W8', name: '조진영', team: 'AX 사업개발팀', avatar: '👩‍💼', employeeNumber: '06443' },
  { id: 'user-24', code: 'VIT-9I2X1', name: '허성훈', team: 'AX 사업개발팀', avatar: '👨‍💼', employeeNumber: '09568' },
  { id: 'user-25', code: 'VIT-50007', name: '이현서', team: '반도체Global사업개발팀', avatar: '👩‍💼', employeeNumber: '50007' },
  { id: 'user-26', code: 'VIT-50008', name: '최지훈', team: '반도체Global사업개발팀', avatar: '👨‍💼', employeeNumber: '50008' },
  // 관리자 계정 (보안: 실제 인증 코드는 환경변수 해시로 서버에서 검증되며 소스코드에 노출되지 않음)
  { id: 'admin-01', code: 'SYSTEM-MANAGED-ADMIN', name: 'HT사업본부 관리자', team: '운영팀', avatar: '👑', role: 'admin' },
];

export const INITIAL_MATE_ASSIGNMENTS: MateAssignment[] = [
  {
    "id": "m-1788923786733-ez1aqy",
    "userId": "user-01",
    "targetUserId": "user-07",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-1kw5ix",
    "userId": "user-01",
    "targetUserId": "user-13",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pa72rn",
    "userId": "user-02",
    "targetUserId": "user-14",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-97mwl4",
    "userId": "user-02",
    "targetUserId": "user-23",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-flo9xe",
    "userId": "user-03",
    "targetUserId": "user-11",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pd5f3j",
    "userId": "user-03",
    "targetUserId": "user-24",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-k5ffwx",
    "userId": "user-04",
    "targetUserId": "user-15",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-bznax1",
    "userId": "user-04",
    "targetUserId": "user-21",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pta81e",
    "userId": "user-05",
    "targetUserId": "user-12",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-bziwse",
    "userId": "user-05",
    "targetUserId": "user-19",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-xm4q7e",
    "userId": "user-06",
    "targetUserId": "user-17",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-tpowby",
    "userId": "user-06",
    "targetUserId": "user-20",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-xkr0bn",
    "userId": "user-07",
    "targetUserId": "user-16",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-rprheu",
    "userId": "user-07",
    "targetUserId": "user-21",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-1y319h",
    "userId": "user-08",
    "targetUserId": "user-20",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-csqyub",
    "userId": "user-08",
    "targetUserId": "user-22",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-o0ofln",
    "userId": "user-09",
    "targetUserId": "user-11",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-ax6gw1",
    "userId": "user-09",
    "targetUserId": "user-19",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-97076b",
    "userId": "user-10",
    "targetUserId": "user-15",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-dm2szb",
    "userId": "user-10",
    "targetUserId": "user-18",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-hu8nlq",
    "userId": "user-11",
    "targetUserId": "user-12",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-x6tb36",
    "userId": "user-11",
    "targetUserId": "user-22",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-qgaq0f",
    "userId": "user-12",
    "targetUserId": "user-14",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pqp1b2",
    "userId": "user-12",
    "targetUserId": "user-24",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-mui3xz",
    "userId": "user-13",
    "targetUserId": "user-02",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-1l5gbm",
    "userId": "user-13",
    "targetUserId": "user-08",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-spmokt",
    "userId": "user-14",
    "targetUserId": "user-03",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-geqjkv",
    "userId": "user-14",
    "targetUserId": "user-10",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-s73rhd",
    "userId": "user-15",
    "targetUserId": "user-01",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-8wdlyl",
    "userId": "user-15",
    "targetUserId": "user-06",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-85whx2",
    "userId": "user-16",
    "targetUserId": "user-07",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-w622t6",
    "userId": "user-16",
    "targetUserId": "user-08",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-cttyh3",
    "userId": "user-17",
    "targetUserId": "user-18",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-qr060f",
    "userId": "user-17",
    "targetUserId": "user-23",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-gtt7ln",
    "userId": "user-18",
    "targetUserId": "user-05",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-ng0gc9",
    "userId": "user-18",
    "targetUserId": "user-10",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-tzv780",
    "userId": "user-19",
    "targetUserId": "user-04",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-qfft3y",
    "userId": "user-19",
    "targetUserId": "user-09",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-rhbkml",
    "userId": "user-20",
    "targetUserId": "user-04",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-yxrrkk",
    "userId": "user-20",
    "targetUserId": "user-05",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-yni2is",
    "userId": "user-21",
    "targetUserId": "user-02",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-7ki5os",
    "userId": "user-21",
    "targetUserId": "user-09",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-o2udqb",
    "userId": "user-22",
    "targetUserId": "user-01",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-ky5wlz",
    "userId": "user-22",
    "targetUserId": "user-16",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-xqipn4",
    "userId": "user-23",
    "targetUserId": "user-06",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-00d5hr",
    "userId": "user-23",
    "targetUserId": "user-13",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-kwf39q",
    "userId": "user-24",
    "targetUserId": "user-03",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-u11lif",
    "userId": "user-24",
    "targetUserId": "user-17",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  }
];
export const INITIAL_PRAISES: PraiseMessage[] = [
  {
    "id": "praise-1789086175199-hmbr",
    "senderUserId": "user-17",
    "recipientUserId": "user-15",
    "recipientName": "강성훈",
    "content": "우리 조직에 필요한 어플을 만들어주셔서 감사합니다. 아이디어 정말 최고입니다",
    "refinedContent": "우리 조직에 필요한 어플을 만들어주셔서 감사합니다. 아이디어 정말 최고입니다",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 11. 오전 9:22:55",
    "isMatePraise": false
  },
  {
    "id": "praise-1789086190497-mvq9",
    "senderUserId": "user-16",
    "recipientUserId": "user-21",
    "recipientName": "박한주",
    "content": "선물 당첨 축하해요~~~😆",
    "refinedContent": "선물 당첨 축하해요~~~😆",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 11. 오전 9:23:10",
    "isMatePraise": false
  },
  {
    "id": "praise-1789086227777-fwrx",
    "senderUserId": "user-16",
    "recipientUserId": "user-12",
    "recipientName": "추현지",
    "content": "선물 당첨 축하해요~~😆 내용물 궁금해요~~~~",
    "refinedContent": "선물 당첨 축하해요~~😆 내용물 궁금해요~~~~",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 11. 오전 9:23:47",
    "isMatePraise": false
  },
  {
    "id": "praise-1789086511453-4xeb",
    "senderUserId": "user-16",
    "recipientUserId": "user-08",
    "recipientName": "마완준",
    "content": "같이 일할 기회가 많지는 않지만.. 즐거운 회사생활 응원해요~~~💪",
    "refinedContent": "같이 일할 기회가 많지는 않지만.. 즐거운 회사생활 응원해요~~~💪",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 11. 오전 9:28:31",
    "isMatePraise": true
  },
  {
    "id": "praise-1789345019394-fzvs",
    "senderUserId": "user-01",
    "recipientUserId": "user-07",
    "recipientName": "김진우",
    "content": "어떤 상황에서도 모든일을 묵묵히 해내는 모습이 멋지십니다. 그리고 사석에서 넘 웃겨요. ㅋ 자주뵈요.",
    "refinedContent": "어떤 상황에서도 모든일을 묵묵히 해내는 모습이 멋지십니다. 그리고 사석에서 넘 웃겨요. ㅋ 자주뵈요.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:16:59",
    "isMatePraise": true
  },
  {
    "id": "praise-1789345234988-kky4",
    "senderUserId": "user-23",
    "recipientUserId": "user-15",
    "recipientName": "강성훈",
    "content": "오랜만에 보는 회사앱입니다!!\n감사합니다.^^",
    "refinedContent": "오랜만에 보는 회사앱입니다!!\n감사합니다.^^",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:20:34",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345351243-55se",
    "senderUserId": "user-18",
    "recipientUserId": "user-05",
    "recipientName": "김유진",
    "content": "하이닉스의 많은 계약건을 매번 친절하게 처리해 주셔서 감사합니다.",
    "refinedContent": "하이닉스의 많은 계약건을 매번 친절하게 처리해 주셔서 감사합니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:22:31",
    "isMatePraise": true
  },
  {
    "id": "praise-1789345403870-pslw",
    "senderUserId": "user-18",
    "recipientUserId": "user-10",
    "recipientName": "이상길",
    "content": "매니저님이 없었으면 이 많은 일을 어찌했을까요? 여러 구성원에게 힘이 되어주시는 매니저님 응원합니다.",
    "refinedContent": "매니저님이 없었으면 이 많은 일을 어찌했을까요? 여러 구성원에게 힘이 되어주시는 매니저님 응원합니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:23:23",
    "isMatePraise": true
  },
  {
    "id": "praise-1789345439890-ncfr",
    "senderUserId": "user-18",
    "recipientUserId": "user-22",
    "recipientName": "강태형",
    "content": "우리 본부의 기술을 책임지는 강태형 매니저님 오늘도 화이팅입니다.",
    "refinedContent": "우리 본부의 기술을 책임지는 강태형 매니저님 오늘도 화이팅입니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:23:59",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345477165-l48k",
    "senderUserId": "user-18",
    "recipientUserId": "user-21",
    "recipientName": "박한주",
    "content": "우리 본부의 몇안되는 긍정캐 매니저님! 우리에게 더 많은 힘을 주세요!",
    "refinedContent": "우리 본부의 몇안되는 긍정캐 매니저님! 우리에게 더 많은 힘을 주세요! 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:24:37",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345511208-243f",
    "senderUserId": "user-18",
    "recipientUserId": "user-20",
    "recipientName": "조상현",
    "content": "오늘도 조용히 맡은바 묵묵히 일해주시는 조상현 매니저님. 즐거운 한주 되세요~",
    "refinedContent": "오늘도 조용히 맡은바 묵묵히 일해주시는 조상현 매니저님. 즐거운 한주 되세요~ 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:25:11",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345545972-yf28",
    "senderUserId": "user-18",
    "recipientUserId": "user-23",
    "recipientName": "조진영",
    "content": "단기간내 핵심 인력으로 성장하고 계신 조진영 매니저님! 당신을 응원합니다.",
    "refinedContent": "단기간내 핵심 인력으로 성장하고 계신 조진영 매니저님! 당신을 응원합니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:25:45",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345606787-cqzv",
    "senderUserId": "user-18",
    "recipientUserId": "user-24",
    "recipientName": "허성훈",
    "content": "최강동안 허성훈 매니저님 !  긍정적이고 적극적인 모습이 보기 좋습니다.",
    "refinedContent": "최강동안 허성훈 매니저님 !  긍정적이고 적극적인 모습이 보기 좋습니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:26:46",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345667999-1oha",
    "senderUserId": "user-18",
    "recipientUserId": "user-02",
    "recipientName": "이은정",
    "content": "본부의 정신적인 지주가 되어주시는 이은정 팀장님 ! 힘을 내세요",
    "refinedContent": "본부의 정신적인 지주가 되어주시는 이은정 팀장님 ! 힘을 내세요 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:27:47",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345747135-du0o",
    "senderUserId": "user-18",
    "recipientUserId": "user-19",
    "recipientName": "한승민",
    "content": "열정가득한 모습이 우리 모두 에게 긍정적인 영향을 주는것 같습니다.",
    "refinedContent": "열정가득한 모습이 우리 모두 에게 긍정적인 영향을 주는것 같습니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:29:07",
    "isMatePraise": false
  },
  {
    "id": "praise-1789345807235-50wb",
    "senderUserId": "user-22",
    "recipientUserId": "user-16",
    "recipientName": "김호인",
    "content": "항상 차분히 꾸준하게 업무 정리해가시는 모습이 멋지십니다.",
    "refinedContent": "항상 차분히 꾸준하게 업무 정리해가시는 모습이 멋지십니다.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:30:07",
    "isMatePraise": true
  },
  {
    "id": "praise-1789346554517-4tli",
    "senderUserId": "user-14",
    "recipientUserId": "user-13",
    "recipientName": "김세진",
    "content": "팀장 첫해라서 어려우실텐데 꿋꿋하게 해나가시는 모습이 보기 좋습니다. 응원합니다",
    "refinedContent": "팀장 첫해라서 어려우실텐데 꿋꿋하게 해나가시는 모습이 보기 좋습니다. 응원합니다",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:42:34",
    "isMatePraise": false
  },
  {
    "id": "praise-1789346655907-no9c",
    "senderUserId": "user-14",
    "recipientUserId": "user-17",
    "recipientName": "마석현",
    "content": "늘 적극적으로 해보려고 노력하는 모습이 멋져요 ~~ 빠른 성장이 기대되요",
    "refinedContent": "늘 적극적으로 해보려고 노력하는 모습이 멋져요 ~~ 빠른 성장이 기대되요 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:44:15",
    "isMatePraise": false
  },
  {
    "id": "praise-1789347258259-ff5j",
    "senderUserId": "user-22",
    "recipientUserId": "user-01",
    "recipientName": "홍태영",
    "content": "나이스 & 스마트의 교과서같으신 본부장님, 항상 많이 배웁니다. 오늘도 화이팅입니다!",
    "refinedContent": "나이스 & 스마트의 교과서같으신 본부장님, 항상 많이 배웁니다. 오늘도 화이팅입니다!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 9:54:18",
    "isMatePraise": true
  },
  {
    "id": "praise-1789351617057-rfb2",
    "senderUserId": "user-01",
    "recipientUserId": "user-14",
    "recipientName": "양정희",
    "content": "퍼블릭 ai, cloud 사업개발 하시느라 매일 야근하시고 고생많으십니다. 책임감 있게 일하는 모습에 많이 배우게 됩니다. 그래도 건강은 항상 잘 챙기세요.",
    "refinedContent": "퍼블릭 ai, cloud 사업개발 하시느라 매일 야근하시고 고생많으십니다. 책임감 있게 일하는 모습에 많이 배우게 됩니다. 그래도 건강은 항상 잘 챙기세요. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오전 11:06:57",
    "isMatePraise": false
  },
  {
    "id": "praise-1789363725414-8o22",
    "senderUserId": "user-19",
    "recipientUserId": "user-04",
    "recipientName": "이원용",
    "content": "본부의 로봇 전문가! 누구에게나 친절하게 이야기 해주셔서. 저같은 I한테는 너무 좋아요 ^^",
    "refinedContent": "본부의 로봇 전문가! 누구에게나 친절하게 이야기 해주셔서. 저같은 I한테는 너무 좋아요 ^^ 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 14. 오후 2:28:45",
    "isMatePraise": true
  },
  {
    "id": "praise-1789430372726-t7zh",
    "senderUserId": "user-15",
    "recipientUserId": "user-09",
    "recipientName": "박병근",
    "content": "“저희팀 계약 업무로 늘 고생 많으세요. 문의드릴때 마다 잘 알려주셔서 감사합니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖”",
    "refinedContent": "저희팀 계약 업무로 늘 고생 많으세요. \n문의드릴때 마다 잘 알려주셔서 감사합니다. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 15. 오전 8:59:32",
    "isMatePraise": false
  },
  {
    "id": "praise-1789430482509-i3c8",
    "senderUserId": "user-15",
    "recipientUserId": "user-03",
    "recipientName": "박정호",
    "content": "“깔끔한 업무 처리 우리 조직을 먼저 생각하는 업무 처리 늘 묵묵히 계약파트를 잘 이끌어주셔서 감사합니다! 담에도 치맥해요 ㅎ 진심으로 고맙습니다! 💖”",
    "refinedContent": "깔끔한 업무 처리 우리 조직을 먼저 생각하는 업무 처리 \n늘 묵묵히 계약파트를 잘 이끌어주셔서 감사합니다! \n담에도 치맥해요 ㅎ 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 15. 오전 9:01:22",
    "isMatePraise": false
  },
  {
    "id": "praise-1789430605778-yfp6",
    "senderUserId": "user-15",
    "recipientUserId": "user-18",
    "recipientName": "조재화",
    "content": "“샤랄라 밝은 미소와 예쁜 모습 그리고 늘 옆팀 구성원들 업무도 관심 가져주셔서 감사해요. 항상 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖”",
    "refinedContent": "샤랄라 밝은 미소와 예쁜 모습 그리고 늘 옆 구성원들 업무도 관심 가져주셔서 감사해요. 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 15. 오전 9:03:25",
    "isMatePraise": false
  },
  {
    "id": "praise-1789430724407-13v0",
    "senderUserId": "user-15",
    "recipientUserId": "user-06",
    "recipientName": "김정수",
    "content": "국내 통합 설비제어 업무 추진하시느라 고생 많으셨어요. \n인디애나도 맡아주세요! ㅎ 멋진 목소리 최고!",
    "refinedContent": "국내 통합 설비제어 업무 추진하시느라 고생 많으셨어요. \n인디애나도 맡아주세요! ㅎ 멋진 목소리 최고! 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 15. 오전 9:05:24",
    "isMatePraise": true
  },
  {
    "id": "praise-1789513750964-rcv0",
    "senderUserId": "user-14",
    "recipientUserId": "user-12",
    "recipientName": "추현지",
    "content": "통통 튀는 매력쟁이 추매니저님 \n이제는 본부에서 허리역할을 충분히 하고 계신것 같아요 ^^ \n매니저님의 밝은 에너지로 본부에 전파부탁드립니다",
    "refinedContent": "통통 튀는 매력쟁이 추매니저님 \n이제는 본부에서 허리역할을 충분히 하고 계신것 같아요 ^^ \n매니저님의 밝은 에너지로 본부에 전파부탁드립니다 매순간 보여주신 열정과 친절함이 함께하는 사람들에게 귀감이 됩니다. 진심으로 감사드려요! 🍀",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 16. 오전 8:09:10",
    "isMatePraise": false
  },
  {
    "id": "praise-1789686739145-j1j8",
    "senderUserId": "user-18",
    "recipientUserId": "user-05",
    "recipientName": "김유진",
    "content": "업무 요청 전 상세하게 설명해주셔서 항상 감사드립니다.",
    "refinedContent": "업무 요청 전 상세하게 설명해주셔서 항상 감사드립니다. 보이지 않는 곳에서도 팀을 위해 마음 써주시는 노고에 깊이 감사드립니다! 👏",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 18. 오전 8:12:19",
    "isMatePraise": true
  },
  {
    "id": "praise-1789686777613-ijh4",
    "senderUserId": "user-18",
    "recipientUserId": "user-10",
    "recipientName": "이상길",
    "content": "매번 유사한 업무라 헤깔리고 힘드실텐데 친절하게 답변 주셔서 감사합니다.",
    "refinedContent": "매번 유사한 업무라 헤깔리고 힘드실텐데 친절하게 답변 주셔서 감사합니다. 매순간 보여주신 열정과 친절함이 함께하는 사람들에게 귀감이 됩니다. 진심으로 감사드려요! 🍀",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 18. 오전 8:12:57",
    "isMatePraise": true
  },
  {
    "id": "praise-1789954498944-its4",
    "senderUserId": "user-07",
    "recipientUserId": "user-18",
    "recipientName": "조재화",
    "content": "바쁘신 와중에 항상 밝은 분위기로 주변환기를 해주시는 것 같아서 감사했습니다. 앞으로도 즐겁게 잘 지냈으면 좋겠습니다!",
    "refinedContent": "바쁘신 와중에 항상 밝은 분위기로 주변환기를 해주시는 것 같아서 감사했습니다. 앞으로도 즐겁게 잘 지냈으면 좋겠습니다!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 21. 오전 10:34:58",
    "isMatePraise": true
  },
  {
    "id": "praise-1789954549701-z01s",
    "senderUserId": "user-07",
    "recipientUserId": "user-16",
    "recipientName": "김호인",
    "content": "요새 많이 바쁘신것 같아서 얼굴 자주 못뵙지만, 가끔 회식자리에서 인사하면 늘 밝고 친절하게 대해주셔서 감사했습니다. 앞으로도 잘 부탁드립니다.",
    "refinedContent": "요새 많이 바쁘신것 같아서 얼굴 자주 못뵙지만, 가끔 회식자리에서 인사하면 늘 밝고 친절하게 대해주셔서 감사했습니다. 앞으로도 잘 부탁드립니다.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 9. 21. 오전 10:35:49",
    "isMatePraise": true
  },
  {
    "id": "praise-1790915947317-3dk3",
    "senderUserId": "user-13",
    "recipientUserId": "user-16",
    "recipientName": "김호인",
    "content": "늦게 조인했는대도 너무 열심히 해줘서 너무 고마워요. 덕분에 든든합니다!! 보이지 않는 곳에서도 팀을 위해 마음 써주시는 노고에 깊이 감사드립니다! 👏",
    "refinedContent": "늦게 조인했는대도 너무 열심히 해줘서 너무 고마워요. 덕분에 든든합니다!! 보이지 않는 곳에서도 팀을 위해 마음 써주시는 노고에 깊이 감사드립니다! 👏",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 2. 오후 1:39:07",
    "isMatePraise": false
  },
  {
    "id": "praise-1790916099354-w4nx",
    "senderUserId": "user-13",
    "recipientUserId": "user-17",
    "recipientName": "마석현",
    "content": "우리 막내 MZ, 요즘 야근하느라 정말 고생 많았어요 😂\n힘든 와중에도 맡은 일 잘 챙겨줘서 고맙고, 덕분에 든든합니다!",
    "refinedContent": "우리 막내 MZ, 요즘 야근하느라 정말 고생 많았어요 😂\n힘든 와중에도 맡은 일 잘 챙겨줘서 고맙고, 덕분에 든든합니다! 언제나 밝은 표정과 유연한 태도로 배려해주셔서 함께 일하는 시간이 즐겁습니다! 💕",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 2. 오후 1:41:39",
    "isMatePraise": false
  },
  {
    "id": "praise-1790922913957-0hzd",
    "senderUserId": "user-24",
    "recipientUserId": "user-17",
    "recipientName": "마석현",
    "content": "핸썸맨 마매니저님, 요며칠 제안 작업때문에 많이 힘들어보여도 외모는 죽지 않고 빛나고 있으니 안심하세요. 화이팅!!",
    "refinedContent": "핸썸맨 마매니저님, 요며칠 제안 작업때문에 많이 힘들어보여도 외모는 죽지 않고 빛나고 있으니 안심하세요. 화이팅!!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 2. 오후 3:35:13",
    "isMatePraise": true
  },
  {
    "id": "praise-1790923065319-mtab",
    "senderUserId": "user-24",
    "recipientUserId": "user-19",
    "recipientName": "한승민",
    "content": "항상 많이 배우고 있어요. 항상 웃음 가득한 표정도 힘이 됩니다. 감사합니다. 팀을 위해 마음 써주시는 노고에 깊이 감사드립니다! 👏",
    "refinedContent": "항상 많이 배우고 있어요. 항상 웃음 가득한 표정도 힘이 됩니다. 감사합니다. 팀을 위해 마음 써주시는 노고에 깊이 감사드립니다! 👏",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 2. 오후 3:37:45",
    "isMatePraise": false
  },
  {
    "id": "praise-1790923197045-gspj",
    "senderUserId": "user-24",
    "recipientUserId": "user-15",
    "recipientName": "강성훈",
    "content": "너무 재미있게 앱 잘 만들어 주셨네요. 바이브로 이정도라니...코딩은 AI가 했어도 기획은 매니저님이 하신거죠? 통통 튀는 아이디어 대단하십니다. 늘 든든하게 받쳐주시고 시너지를 내주셔서 감사한 마음입니다. 앞으로도 화이팅입니다! 🎉",
    "refinedContent": "너무 재미있게 앱 잘 만들어 주셨네요. 바이브로 이정도라니...코딩은 AI가 했어도 기획은 매니저님이 하신거죠? 통통 튀는 아이디어 대단하십니다. 늘 든든하게 받쳐주시고 시너지를 내주셔서 감사한 마음입니다. 앞으로도 화이팅입니다! 🎉",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 2. 오후 3:39:57",
    "isMatePraise": false
  },
  {
    "id": "praise-1791496767974-l3ia",
    "senderUserId": "user-01",
    "recipientUserId": "user-13",
    "recipientName": "김세진",
    "content": "항상 씩씩하신 팀장님을 응원합니다. 글로벌 사업도 빵빵 키워주실거죠.? ^^ 올해 새로운팀을 맡으셔서 고생이셨을거 같습니다. 내년에는 팀장님도 팀도 더 근사한 모습이 되시길 기원합니다.",
    "refinedContent": "항상 씩씩하신 팀장님을 응원합니다. 글로벌 사업도 빵빵 키워주실거죠.? ^^ 올해 새로운팀을 맡으셔서 고생이셨을거 같습니다. 내년에는 팀장님도 팀도 더 근사한 모습이 되시길 기원합니다. 작은 부분까지 책임감 있게 챙겨주셔서 큰 도움이 되었습니다. 멋진 동료와 함께해서 기뻐요! 😊",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 9. 오전 6:59:27",
    "isMatePraise": true
  },
  {
    "id": "praise-1791955459615-n8gg",
    "senderUserId": "user-15",
    "recipientUserId": "user-01",
    "recipientName": "홍태영",
    "content": "미국법인장(겸) 임명 추카추카드립니다. 올해도 내년도 더 바빠지실 것 같은데 항상 건강 잘 챙기시고 스트레스 관리도 잘 하시면 좋겠습니다. \n팀장님들께도 칭찬 많이 해주세요. 내리 갈굼은 없어지고 내리 사랑만 남기를.. \n앞으로도 화이팅입니다! 🎉",
    "refinedContent": "미국법인장(겸) 임명 추카추카드립니다. 올해도 내년도 더 바빠지실 것 같은데 항상 건강 잘 챙기시고 스트레스 관리도 잘 하시면 좋겠습니다. \n팀장님들께도 칭찬 많이 해주세요. 내리 갈굼은 없어지고 내리 사랑만 남기를.. 늘 든든하게 받쳐주시고 시너지를 내주셔서 감사한 마음입니다. 앞으로도 화이팅입니다! 🎉",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 14. 오후 2:24:19",
    "isMatePraise": true
  },
  {
    "id": "praise-1791956544539-4wr3",
    "senderUserId": "user-03",
    "recipientUserId": "user-13",
    "recipientName": "김세진",
    "content": "항상 밝고 긍정적인 팀장님 응원합니다. ^^",
    "refinedContent": "항상 밝고 긍정적인 팀장님 응원합니다. ^^",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 14. 오후 2:42:24",
    "isMatePraise": true
  },
  {
    "id": "praise-1791956744515-az38",
    "senderUserId": "user-03",
    "recipientUserId": "user-20",
    "recipientName": "조상현",
    "content": "항상 온화한 미소에 친절한 조상현매니저님 화이팅~^^",
    "refinedContent": "항상 온화한 미소에 친절한 조상현매니저님 화이팅~^^",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 14. 오후 2:45:44",
    "isMatePraise": false
  },
  {
    "id": "praise-1792385520627-oqc8",
    "senderUserId": "user-10",
    "recipientUserId": "user-05",
    "recipientName": "김유진",
    "content": "바쁘신데도 항상 긍정적으로 업무에 임하시고 친절하셔서 많은 도움 받고 있습니다.\n화이팅 입니다. 고맙습니다.",
    "refinedContent": "바쁘신데도 항상 긍정적으로 업무에 임하시고 친절하셔서 많은 도움 받고 있습니다.\n화이팅 입니다. 고맙습니다. 매순간 보여주신 열정과 친절함이 함께하는 사람들에게 귀감이 됩니다. 진심으로 감사드려요! 🍀",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 19. 오후 1:52:00",
    "isMatePraise": false
  },
  {
    "id": "praise-1792385598016-of77",
    "senderUserId": "user-10",
    "recipientUserId": "user-08",
    "recipientName": "마완준",
    "content": "막내가 쉽지는 않습니다. 귀찮죠 ㅋㅋㅋ\n그러나 항상밝고 긍정적이셔서 많은 도움받고 있습니다.\n감사해요.",
    "refinedContent": "막내가 쉽지는 않습니다. 귀찮죠 ㅋㅋㅋ\n그러나 항상밝고 긍정적이셔서 많은 도움받고 있습니다.\n감사해요. 묵묵히 최선을 다해주시는 덕분에 언제나 안심하고 함께 일할 수 있어요. 진심으로 감사해요! 🌟",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 19. 오후 1:53:18",
    "isMatePraise": false
  },
  {
    "id": "praise-1792649262420-l00w",
    "senderUserId": "user-23",
    "recipientUserId": "user-13",
    "recipientName": "김세진",
    "content": "인디애나 사업으로 힘드실텐데, 밝고 씩씩하신 모습에 감동입니다. ^^ 김세진 팀장님, 화이팅 하세요~~~",
    "refinedContent": "인디애나 사업으로 힘드실텐데, 밝고 씩씩하신 모습에 감동입니다. ^^ 김세진 팀장님, 화이팅 하세요~~ 묵묵히 최선을 다해주시는 덕분에 언제나 안심하고 함께 일할 수 있어요. 진심으로 감사해요! 🌟",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:07:42",
    "isMatePraise": false
  },
  {
    "id": "praise-1792649469856-dd43",
    "senderUserId": "user-23",
    "recipientUserId": "user-06",
    "recipientName": "김정수",
    "content": "멀리 계시지만 묵묵하게 일하시는 모습 보면, 든든함이 느껴집니다. 응원합니다~~!!!",
    "refinedContent": "멀리 계시지만 묵묵하게 일하시는 모습 보면, 든든함이 느껴집니다. 응원합니다~~!!! 세심한 관심과 센스 덕분에 팀 분위기가 한층 더 밝아지는 것 같아요. 늘 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:11:09",
    "isMatePraise": false
  },
  {
    "id": "praise-1792649482587-cqiq",
    "senderUserId": "user-24",
    "recipientUserId": "user-03",
    "recipientName": "박정호",
    "content": "파트장님, 업무로 바쁘실텐데 항상 건강 관리 잘하시면서 일하시면 좋겠습니다.",
    "refinedContent": "파트장님, 업무로 바쁘실텐데 항상 건강 관리 잘하시면서 일하시면 좋겠습니다. 따뜻한 미소와 인내심으로 함께해주셔서 업무 현장이 훨씬 더 훈훈해지는 느낌입니다! 🔥",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:11:22",
    "isMatePraise": false
  },
  {
    "id": "praise-1792649486226-yuik",
    "senderUserId": "user-09",
    "recipientUserId": "user-01",
    "recipientName": "홍태영",
    "content": "본부장님~이제야 봤습니다 ㅎ 두개 본부를 챙기시느라 부쩍 더 바빠지셔서 축하? 드립니다 롱런을 위해 모쪼록 건강과 가족 잘 챙기시길 바랍니다 화이팅~~",
    "refinedContent": "본부장님~이제야 봤습니다 ㅎ 두개 본부를 챙기시느라 부쩍 더 바빠지셔서 축하? 드립니다 롱런을 위해 모쪼록 건강과 가족 잘 챙기시길 바랍니다 화이팅~~ 동료들을 먼저 챙겨주시는 성실한 모습에 큰 감동을 받았습니다. 언제나 응원합니다! 👍",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:11:26",
    "isMatePraise": false
  },
  {
    "id": "praise-1792649608542-fu43",
    "senderUserId": "user-23",
    "recipientUserId": "user-15",
    "recipientName": "강성훈",
    "content": "추진력 짱!!! 멋집니다.",
    "refinedContent": "추진력 짱!!! 멋집니다.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:13:28",
    "isMatePraise": false
  },
  {
    "id": "praise-1792649800876-mghe",
    "senderUserId": "user-09",
    "recipientUserId": "user-19",
    "recipientName": "한승민",
    "content": "파트장님~~올해도 하이닉스 AI를 이끄시느라 고생이 많으셨습니다 가족과 즐거운 주말 휴가 보내시고 일에도 좋은 성과 내시길 바랍니다",
    "refinedContent": "파트장님~~올해도 하이닉스 AI를 이끄시느라 고생이 많으셨습니다 가족과 즐거운 주말 휴가 보내시고 일에도 좋은 성과 내시길 바랍니다",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:16:40",
    "isMatePraise": false
  },
  {
    "id": "praise-1792650047299-8vdm",
    "senderUserId": "user-23",
    "recipientUserId": "user-22",
    "recipientName": "강태형",
    "content": "듬직하고 책임감있게 일하시는 멋진 동료입니다. 항상 응원합니다.",
    "refinedContent": "듬직하고 책임감있게 일하시는 멋진 동료입니다. 항상 응원합니다.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:20:47",
    "isMatePraise": false
  },
  {
    "id": "praise-1792650124122-b5kx",
    "senderUserId": "user-23",
    "recipientUserId": "user-20",
    "recipientName": "조상현",
    "content": "침착함과 차분함이 빛나는 멋진 동료입니다. 옆에서 보고 많이 배우겠습니다.",
    "refinedContent": "침착함과 차분함이 빛나는 멋진 동료입니다. 옆에서 보고 많이 배우겠습니다.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:22:04",
    "isMatePraise": false
  },
  {
    "id": "praise-1792650267099-xcz6",
    "senderUserId": "user-23",
    "recipientUserId": "user-21",
    "recipientName": "박한주",
    "content": "딜리버리와 항상 가까이에서 고민하고 계신 모습이 빛나 보입니다. 응원드려요~~~!!!!",
    "refinedContent": "딜리버리와 항상 가까이에서 고민하고 계신 모습이 빛나 보입니다. 응원드려요~~~!!!!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:24:27",
    "isMatePraise": false
  },
  {
    "id": "praise-1792650322261-3w84",
    "senderUserId": "user-23",
    "recipientUserId": "user-18",
    "recipientName": "조재화",
    "content": "통찰력을 가지고 책임감 있게 팀을 이끌어주셔서 감사합니다!!!",
    "refinedContent": "통찰력을 가지고 책임감 있게 팀을 이끌어주셔서 감사합니다!!!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:25:22",
    "isMatePraise": false
  },
  {
    "id": "praise-1792650432834-tdiu",
    "senderUserId": "user-23",
    "recipientUserId": "user-19",
    "recipientName": "한승민",
    "content": "AI로 고객과 미래를 변화시키실 것 같습니다~~ 화이팅하세요!!!!",
    "refinedContent": "AI로 고객과 미래를 변화시키실 것 같습니다~~ 화이팅하세요!!!!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:27:12",
    "isMatePraise": false
  },
  {
    "id": "praise-1792650541141-j22h",
    "senderUserId": "user-23",
    "recipientUserId": "user-24",
    "recipientName": "허성훈",
    "content": "AI 기술 전문가이자, 진정 영업으로 거듭나고 있는 매니저님, 응원하겠습니다~~!!!!",
    "refinedContent": "AI 기술 전문가이자, 진정 영업으로 거듭나고 있는 매니저님, 응원하겠습니다~~!!!!",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 3:29:01",
    "isMatePraise": false
  },
  {
    "id": "praise-1792653477300-527o",
    "senderUserId": "user-21",
    "recipientUserId": "user-02",
    "recipientName": "이은정",
    "content": "항상 에너지가 넘치십니다",
    "refinedContent": "항상 에너지가 넘치십니다 세심한 관심과 센스 덕분에 팀 분위기가 한층 더 밝아지는 것 같아요. 늘 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 22. 오후 4:17:57",
    "isMatePraise": false
  },
  {
    "id": "praise-1792714895199-b7qs",
    "senderUserId": "user-14",
    "recipientUserId": "user-18",
    "recipientName": "조재화",
    "content": "하이닉스 AI 사업이 점점 많아지는데 고생이 많으세요 그래도 열심히 일하시는 모습 보기 좋습니다. \n팀장님 화이팅 👏🏻하세요",
    "refinedContent": "하이닉스 AI 사업이 점점 많아지는데 고생이 많으세요 그래도 열심히 일하시는 모습 보기 좋습니다. \n팀장님 화이팅 👏🏻하세요 언제나 밝은 표정과 유연한 태도로 배려해주셔서 함께 일하는 시간이 즐겁습니다! 💕",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 9:21:35",
    "isMatePraise": false
  },
  {
    "id": "praise-1792714996807-whe7",
    "senderUserId": "user-02",
    "recipientUserId": "user-16",
    "recipientName": "김호인",
    "content": "늘 차분하고 성실한, 가끔 말걸면 웃긴 여성",
    "refinedContent": "늘 차분하고 성실한, 가끔 말걸면 웃긴 여성",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 9:23:16",
    "isMatePraise": false
  },
  {
    "id": "praise-1792715085548-w1zl",
    "senderUserId": "user-14",
    "recipientUserId": "user-04",
    "recipientName": "이원용",
    "content": "본부 피지컬 AI 전문가 이원용 매니저님 \n이제 대세는 로봇사업인거 같은데 본부 구성원들에게도 많은 소개 부탁드립니다 항상 밝고 적극적인 모습으로 대해주셔서 보는 사람도 편하게 다가갈수 있는것 같아요 ^^",
    "refinedContent": "본부 피지컬 AI 전문가 이원용 매니저님 \n이제 대세는 로봇사업인거 같은데 본부 구성원들에게도 많은 소개 부탁드립니다 항상 밝고 적극적인 모습으로 대해주셔서 보는 사람도 편하게 다가갈수 있는것 같아요 ^^",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 9:24:45",
    "isMatePraise": false
  },
  {
    "id": "praise-1792715675511-5z9y",
    "senderUserId": "user-14",
    "recipientUserId": "user-07",
    "recipientName": "김진우",
    "content": "은근한 코미디언인 김진우 매니저님 \n뛰어난 재치와 유머로 대화하면 너무 웃껴요 ^^ \n보이는건 조용할것 같으신데 이야기 나누다보면 금새 친근해져요 ~",
    "refinedContent": "은근한 코미디언인 김진우 매니저님 \n뛰어난 재치와 유머로 대화하면 너무 웃껴요 ^^ \n보이는건 조용할것 같으신데 이야기 나누다보면 금새 친근해져요 ~",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 9:34:35",
    "isMatePraise": false
  },
  {
    "id": "praise-1792717852518-il9j",
    "senderUserId": "user-11",
    "recipientUserId": "user-18",
    "recipientName": "조재화",
    "content": "어려운 이슈가 생겼을 때도 차분하게 방향을 잡아 주시는 모습에서 많이 배웁니다",
    "refinedContent": "어려운 이슈가 생겼을 때도 차분하게 방향을 잡아 주시는 모습에서 많이 배웁니다",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 10:10:52",
    "isMatePraise": false
  },
  {
    "id": "praise-1792718105609-cxud",
    "senderUserId": "user-11",
    "recipientUserId": "user-01",
    "recipientName": "홍태영",
    "content": "본부장님께서 본부의 사업 전략을 분명하게 제시해 주셔서, 현장에서 일하는 구성원들이 일관성있게 업무를 집중하여 진행 할 수 있는것 같습니다",
    "refinedContent": "본부장님께서 본부의 사업 전략을 분명하게 제시해 주셔서, 현장에서 일하는 구성원들이 일관성있게 업무를 집중하여 진행 할 수 있는것 같습니다",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 10:15:05",
    "isMatePraise": false
  },
  {
    "id": "praise-1792718287321-5jkb",
    "senderUserId": "user-11",
    "recipientUserId": "user-21",
    "recipientName": "박한주",
    "content": "새로운 일이 생겨도 '해보겠습니다'로 시작하는 모습이 늘 인상 깊어요. 본부에 큰 힘이 됩니다",
    "refinedContent": "새로운 일이 생겨도 '해보겠습니다'로 시작하는 모습이 늘 인상 깊어요. 본부에 큰 힘이 됩니다",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 10:18:07",
    "isMatePraise": false
  },
  {
    "id": "praise-1792718344409-tsd7",
    "senderUserId": "user-11",
    "recipientUserId": "user-09",
    "recipientName": "박병근",
    "content": "어려운 상황에서도 긍정적으로 방향을 찾아 주셔서, 주변 사람들까지 힘이 납니다.",
    "refinedContent": "어려운 상황에서도 긍정적으로 방향을 찾아 주셔서, 주변 사람들까지 힘이 납니다.",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 23. 오전 10:19:04",
    "isMatePraise": false
  },
  {
    "id": "praise-1792962539456-nbtv",
    "senderUserId": "user-10",
    "recipientUserId": "user-15",
    "recipientName": "강성훈",
    "content": "항상 본부를 위해 노력 봉사 하시는 모습에 박수를 보내고 응원합니다.",
    "refinedContent": "항상 본부를 위해 노력 봉사 하시는 모습에 박수를 보내고 응원합니다. 세심한 관심과 센스 덕분에 팀 분위기가 한층 더 밝아지는 것 같아요. 늘 고맙습니다! 💖",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 26. 오전 6:08:59",
    "isMatePraise": false
  },
  {
    "id": "praise-1792962671849-pb0q",
    "senderUserId": "user-10",
    "recipientUserId": "user-18",
    "recipientName": "조재화",
    "content": "매사 밝고 화이팅 넘치고 긍정 에너지를 가진 팀장님의 모습은 모든 분부원의 귀감이 됩니다.",
    "refinedContent": "매사 밝고 화이팅 넘치고 긍정 에너지를 가진 팀장님의 모습은 모든 분부원의 귀감이 됩니다. 묵묵히 최선을 다해주시는 덕분에 언제나 안심하고 함께 일할 수 있어요. 진심으로 감사해요! 🌟",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 26. 오전 6:11:11",
    "isMatePraise": false
  },
  {
    "id": "praise-1792977248267-lhwy",
    "senderUserId": "user-20",
    "recipientUserId": "user-04",
    "recipientName": "이원용",
    "content": "아무도 가보지 않은 새로운 사업 영역을 개척하시는 모습이 멋집니다. 내년에는 더 많은 성과가 나기를 항상 응원합니다 늘 든든하게 받쳐주시고 시너지를 내주셔서 감사한 마음입니다. 앞으로도 화이팅입니다! 🎉",
    "refinedContent": "아무도 가보지 않은 새로운 사업 영역을 개척하시는 모습이 멋집니다. 내년에는 더 많은 성과가 나기를 항상 응원합니다 늘 든든하게 받쳐주시고 시너지를 내주셔서 감사한 마음입니다. 앞으로도 화이팅입니다! 🎉",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 26. 오전 10:14:08",
    "isMatePraise": false
  },
  {
    "id": "praise-1792977448345-fgfz",
    "senderUserId": "user-20",
    "recipientUserId": "user-05",
    "recipientName": "김유진",
    "content": "늘 우리 본부의 원활한 사업 진행을 위해 수고해 주셔서 감사합니다. 작은 부분까지 책임감 있게 챙겨주셔서 큰 도움이 되었습니다. 멋진 동료와 함께해서 기뻐요!",
    "refinedContent": "“늘 우리 본부의 원활한 사업 진행을 위해 수고해 주셔서 감사합니다. 세심한 관심과 센스 덕분에 팀 분위기가 한층 더 밝아지는 것 같아요. 늘 고맙습니다! ” 작은 부분까지 책임감 있게 챙겨주셔서 큰 도움이 되었습니다. 멋진 동료와 함께해서 기뻐요! 😊",
    "likes": 0,
    "likedBy": [],
    "createdAt": "2026. 10. 26. 오전 10:17:28",
    "isMatePraise": false
  }
];
export const INITIAL_NOTES: PrivateNote[] = [
  {
    "id": "note-1791955481492-l4i7",
    "userId": "user-15",
    "targetUserId": "user-01",
    "content": "매우 바쁨, 고민이 많아 보임.",
    "updatedAt": "2026. 10. 14. 오후 2:24:41"
  },
  {
    "id": "note-1792649217982-w2mn",
    "userId": "user-23",
    "targetUserId": "user-13",
    "content": "인디애나 사업으로 힘드실텐데, 밝고 씩씩하신 모습에 감동입니다. ^^ 김세진 팀장님, 화이팅!!!",
    "updatedAt": "2026. 10. 22. 오후 3:06:56"
  },
  {
    "id": "note-1792649341105-vww1",
    "userId": "user-23",
    "targetUserId": "user-06",
    "content": "묵묵하게 일하시는 모습, 먼 발치에서나마 응원드려요~~\n\n지금 지나가셨음. 스토커 필로 몰래 응원함.",
    "updatedAt": "2026. 10. 22. 오후 3:18:18"
  },
  {
    "id": "note-1791955507745-jkk4",
    "userId": "user-15",
    "targetUserId": "user-06",
    "content": "청주 P&T 보다 결기가 중요합니다. !\n따님 수능 합격기원 ㅎ",
    "updatedAt": "2026. 10. 22. 오후 9:16:26"
  },
  {
    "id": "note-1792671452163-fwhb",
    "userId": "user-15",
    "targetUserId": "user-13",
    "content": "하이테크에서 팀장 1년차 너무 고생 많으십니다. \n많이 못 도와드려 항상 죄송한 마음입니다. \n우리 화이팅!",
    "updatedAt": "2026. 10. 22. 오후 9:17:35"
  },
  {
    "id": "note-1792671494755-pncd",
    "userId": "user-15",
    "targetUserId": "user-22",
    "content": "항상 웃는 얼굴, 예의 바른 청년, 일본 노래 잘알고 AI도 잘 아는 능력자",
    "updatedAt": "2026. 10. 22. 오후 9:18:13"
  },
  {
    "id": "note-1792671522951-fz6c",
    "userId": "user-15",
    "targetUserId": "user-18",
    "content": "샤방샤방, 이쁜 팀장님 ~ 사랑합니다",
    "updatedAt": "2026. 10. 22. 오후 9:18:42"
  },
  {
    "id": "note-1792671570161-pzpt",
    "userId": "user-15",
    "targetUserId": "user-04",
    "content": "Physical AI 최강자, 몸도 마음도 최강자",
    "updatedAt": "2026. 10. 22. 오후 9:19:29"
  },
  {
    "id": "note-1792671607272-ylxe",
    "userId": "user-15",
    "targetUserId": "user-21",
    "content": "항상 웃는 얼굴, 조꾸우오앙, 이천 황태즈아",
    "updatedAt": "2026. 10. 22. 오후 9:20:06"
  },
  {
    "id": "note-1792671643173-lq5w",
    "userId": "user-15",
    "targetUserId": "user-09",
    "content": "저희팀 계약 잘 챙겨주셔서 감사합니다! \n테니스 황태자! 한판 뜨시죵 ㅋㅋ",
    "updatedAt": "2026. 10. 22. 오후 9:20:41"
  },
  {
    "id": "note-1788923892262-3aq5",
    "userId": "user-15",
    "targetUserId": "user-16",
    "content": "멋져! 인디애나를 잘 부탁드립니다 ㅠ",
    "updatedAt": "2026. 10. 22. 오후 9:21:02"
  },
  {
    "id": "note-1792671702397-9cpf",
    "userId": "user-15",
    "targetUserId": "user-05",
    "content": "아직 잘 모르지만, 천천히 친해지고 싶어요. \n이번 행사 참석해주셔서 감사감사 ㅎ",
    "updatedAt": "2026. 10. 22. 오후 9:21:41"
  },
  {
    "id": "note-1792671751733-dxmd",
    "userId": "user-15",
    "targetUserId": "user-07",
    "content": "디지털 트윈! 가즈아! \nAI Vitamin 모바일 웹 오류 알려주셔서 감사합니당! \n자주 점심해요",
    "updatedAt": "2026. 10. 22. 오후 9:22:31"
  },
  {
    "id": "note-1792671803657-52ur",
    "userId": "user-15",
    "targetUserId": "user-17",
    "content": "MC 마 최고! 디샘보~ 가즈아! ㅋㅋ",
    "updatedAt": "2026. 10. 22. 오후 9:24:48"
  },
  {
    "id": "note-1792671957231-opue",
    "userId": "user-15",
    "targetUserId": "user-08",
    "content": "좋은날 다 갔습니디. 웰컴투더 헬 ㅋㅋ 화이팅",
    "updatedAt": "2026. 10. 22. 오후 9:25:56"
  },
  {
    "id": "note-1792671994920-2feo",
    "userId": "user-15",
    "targetUserId": "user-03",
    "content": "든든한 큰형님! 커피 타임 감사합니다! \n도울 사항 있으면 언제든 알려주세요!",
    "updatedAt": "2026. 10. 22. 오후 9:26:33"
  },
  {
    "id": "note-1792672043796-krwj",
    "userId": "user-15",
    "targetUserId": "user-14",
    "content": "마음 고생 , 몸 고생, 올 한해 고생 많으셨어요. 좋은 결과 있을 겁니다. CL3 가즈아!",
    "updatedAt": "2026. 10. 22. 오후 9:27:22"
  },
  {
    "id": "note-1792672092484-rygy",
    "userId": "user-15",
    "targetUserId": "user-10",
    "content": "인디애나 설비제어 계약 잘 챙겨주셔서 감사합니다! \n형님 ~ 다음에 치맥 사주새용 ㅎ",
    "updatedAt": "2026. 10. 22. 오후 9:28:11"
  },
  {
    "id": "note-1792672133419-8m5d",
    "userId": "user-15",
    "targetUserId": "user-02",
    "content": "팀장님, 많이 배웁니다. 내년에 임원 되셨으면 좋겠어요!",
    "updatedAt": "2026. 10. 22. 오후 9:28:51"
  },
  {
    "id": "note-1792672163879-kkz2",
    "userId": "user-15",
    "targetUserId": "user-20",
    "content": "이름 잘 못 써서 죄송합니다 ㅠ \n친해져요 우리~",
    "updatedAt": "2026. 10. 22. 오후 9:29:23"
  },
  {
    "id": "note-1792672230455-89k6",
    "userId": "user-15",
    "targetUserId": "user-23",
    "content": "올해 이동 하셔서 고생 많우십니다. 든든한 누님으로 팀을 잘 받쳐주세요!",
    "updatedAt": "2026. 10. 22. 오후 9:30:29"
  },
  {
    "id": "note-1792672274003-z4uf",
    "userId": "user-15",
    "targetUserId": "user-11",
    "content": "위원님~ 이천에서 외롭게 고샹이 많으십니다. 가끔 정자 오시면 알려주세요. 점심도 산책도 함께해요. 스크린도 가시죠!",
    "updatedAt": "2026. 10. 22. 오후 9:31:13"
  },
  {
    "id": "note-1792672332614-1l1f",
    "userId": "user-15",
    "targetUserId": "user-12",
    "content": "추현지 최고! 노래도 춤도 잘하고! 샌위치 친구 좋아요! \n송년회 MC를 잘 부탁해요 🙏",
    "updatedAt": "2026. 10. 22. 오후 9:32:11"
  },
  {
    "id": "note-1792672385009-cv4h",
    "userId": "user-15",
    "targetUserId": "user-19",
    "content": "스마트한 우리 파트장님, 나라/마음 키우시느라 고생 많으십니다. 딸들 너무 예뻐서 깜놀! 어떻게 사돈 가능할까요? ㅋㅋ",
    "updatedAt": "2026. 10. 22. 오후 9:33:16"
  },
  {
    "id": "note-1792672436544-xmtw",
    "userId": "user-15",
    "targetUserId": "user-24",
    "content": "골프 잘치고 좋아한다고 들었는데.. 교류가 적었네요. \n일 많다고 들었는데 고생 많으십니다. 우리 점김 해요!",
    "updatedAt": "2026. 10. 22. 오후 9:33:55"
  },
  {
    "id": "note-1793072875289-dmjm",
    "userId": "user-10",
    "targetUserId": "user-15",
    "content": "본부일에 적극적으로 임하시고, 본부 단합을 위해 노력하심",
    "updatedAt": "2026. 10. 27. 오후 12:47:57"
  },
  {
    "id": "note-1793072950745-mh0c",
    "userId": "user-10",
    "targetUserId": "user-18",
    "content": "본부의 AI 핵심 과제를 불철주야 챙기고계심. 구성원에게 귀감이 됨",
    "updatedAt": "2026. 10. 27. 오후 12:49:11"
  }
];
