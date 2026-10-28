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

export function parseDateToTimestamp(d?: any, id?: string): number {
  if (!d) return 0;
  if (typeof d === 'number') return d;
  const isoTime = new Date(d).getTime();
  if (!isNaN(isoTime)) return isoTime;

  // Handle Korean locale date: "2026. 10. 22. 오후 9:16:26" or "2026. 9. 11. 오전 9:22:55"
  const m = String(d).match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (m) {
    let [_, y, mon, day, period, h, min, s] = m;
    let hour = parseInt(h, 10);
    if (period === '오후' && hour < 12) hour += 12;
    if (period === '오전' && hour === 12) hour = 0;
    return new Date(parseInt(y, 10), parseInt(mon, 10) - 1, parseInt(day, 10), hour, parseInt(min, 10), parseInt(s, 10)).getTime();
  }

  // Fallback to timestamp embedded in ID (e.g. note-1791955507745-jkk4 or praise-1789086175199-hmbr)
  if (id) {
    const idMatch = String(id).match(/-(\d{12,14})-/);
    if (idMatch) return parseInt(idMatch[1], 10);
  }
  return 0;
}
