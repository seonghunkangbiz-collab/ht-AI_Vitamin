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
    "targetUserId": "user-16",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-97mwl4",
    "userId": "user-02",
    "targetUserId": "user-19",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pd5f3j",
    "userId": "user-03",
    "targetUserId": "user-24",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-flo9xe",
    "userId": "user-03",
    "targetUserId": "user-13",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-bznax1",
    "userId": "user-04",
    "targetUserId": "user-21",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-k5ffwx",
    "userId": "user-04",
    "targetUserId": "user-15",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pta81e",
    "userId": "user-05",
    "targetUserId": "user-15",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-bziwse",
    "userId": "user-05",
    "targetUserId": "user-19",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-tpowby",
    "userId": "user-06",
    "targetUserId": "user-18",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-xm4q7e",
    "userId": "user-06",
    "targetUserId": "user-17",
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
    "targetUserId": "user-18",
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
    "id": "m-1788923786733-ax6gw1",
    "userId": "user-09",
    "targetUserId": "user-19",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-o0ofln",
    "userId": "user-09",
    "targetUserId": "user-01",
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
    "id": "m-1788923786733-x6tb36",
    "userId": "user-11",
    "targetUserId": "user-18",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-hu8nlq",
    "userId": "user-11",
    "targetUserId": "user-01",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-pqp1b2",
    "userId": "user-12",
    "targetUserId": "user-24",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-qgaq0f",
    "userId": "user-12",
    "targetUserId": "user-15",
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
    "targetUserId": "user-05",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-spmokt",
    "userId": "user-14",
    "targetUserId": "user-04",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-geqjkv",
    "userId": "user-14",
    "targetUserId": "user-18",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-8wdlyl",
    "userId": "user-15",
    "targetUserId": "user-06",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-s73rhd",
    "userId": "user-15",
    "targetUserId": "user-01",
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
    "id": "m-1788923786733-qr060f",
    "userId": "user-17",
    "targetUserId": "user-23",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-cttyh3",
    "userId": "user-17",
    "targetUserId": "user-18",
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
    "id": "m-1788923786733-qfft3y",
    "userId": "user-19",
    "targetUserId": "user-06",
    "assignedAt": "2026-09-09T03:16:26.732+00:00"
  },
  {
    "id": "m-1788923786733-tzv780",
    "userId": "user-19",
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
    "id": "m-1788923786733-rhbkml",
    "userId": "user-20",
    "targetUserId": "user-04",
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
    "targetUserId": "user-06",
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
export const INITIAL_PRAISES: PraiseMessage[] = [];
export const INITIAL_NOTES: PrivateNote[] = [
  {
    "id": "note-1788923892262-3aq5",
    "userId": "user-15",
    "targetUserId": "user-16",
    "content": "멋져",
    "updatedAt": "2026-09-09T03:18:12.019+00:00"
  },
  {
    "id": "note-1791955481492-l4i7",
    "userId": "user-15",
    "targetUserId": "user-01",
    "content": "매우 바쁨, 고민이 많아 보임. ",
    "updatedAt": "2026-10-14T05:24:41.25+00:00"
  },
  {
    "id": "note-1791955507745-jkk4",
    "userId": "user-15",
    "targetUserId": "user-06",
    "content": "젠틀한 모습, 멋진 목소리, 고3 라이딩 화이팅!",
    "updatedAt": "2026-10-14T05:25:07.508+00:00"
  }
];
