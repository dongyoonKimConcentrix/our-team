/**
 * 날짜 표시: 월·일 10 미만이면 0 채움 (2월 → 02월, 5일 → 05일)
 */

/**
 * Date 또는 ISO 날짜 문자열을 "YYYY년 MM월 DD일" 형식으로 (월·일 2자리)
 */
export function formatDateKo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date.includes('T') ? date : date + 'Z') : date;
  if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일`;
}

/**
 * "MM월 DD일"만 (차트 등 짧은 라벨용, 월·일 2자리)
 */
export function formatMonthDayKo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date.includes('T') ? date : date + 'Z') : date;
  if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}월 ${day}일`;
}

/**
 * 날짜+시간을 "YYYY년 MM월 DD일 HH:mm" 형식으로 (월·일·시·분 2자리)
 */
export function formatDateTimeKo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일 ${h}:${min}`;
}
