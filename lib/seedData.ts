import { User, PraiseMessage, PrivateNote, MateAssignment } from './types';

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
  // 관리자 계정
  { id: 'admin-01', code: 'VIT-ADMIN', name: 'HT사업본부 관리자', team: '운영팀', avatar: '👑', role: 'admin', employeeNumber: 'ADMIN' },
];

export const INITIAL_MATE_ASSIGNMENTS: MateAssignment[] = [];

export const INITIAL_PRAISES: PraiseMessage[] = [];

export const INITIAL_NOTES: PrivateNote[] = [];

