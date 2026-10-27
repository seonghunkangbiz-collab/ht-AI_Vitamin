/**
 * HT 사업본부 직책 매핑 및 포맷 유틸리티
 * 
 * 직책 기준:
 * - 홍태영: 본부장
 * - 이은정: 팀장
 * - 김세진: 팀장
 * - 조재화: 팀장
 * - 그 외 전체 인원: 매니저
 */

export function getUserTitle(name?: string | null): string {
  if (!name) return '매니저';
  const clean = name.trim();
  if (clean.includes('홍태영')) return '본부장';
  if (clean.includes('이은정') || clean.includes('김세진') || clean.includes('조재화')) return '팀장';
  return '매니저';
}

export function formatNameWithTitle(name?: string | null): string {
  if (!name) return '';
  const clean = name.trim();
  if (clean.includes('본부장') || clean.includes('팀장') || clean.includes('매니저')) {
    return clean;
  }
  const title = getUserTitle(clean);
  return `${clean} ${title}`;
}
