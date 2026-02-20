/**
 * 연락처 표시: 'phone: ' 등 접두사 제거, 전화번호는 010-XXXX-XXXX(3-4-4) 형식으로 포맷
 */

/** 숫자만 추출 후 010이면 010-XXXX-XXXX(3-4-4)로 포맷 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

/**
 * 단일 연락처 문자열에서 'phone: ', 'tel: ' 등 접두사 제거 후
 * 전화번호면 010-XXXX-XXXX로 포맷
 */
export function formatContactValue(raw: string): string {
  if (!raw || raw === '-') return '-';
  const trimmed = raw.trim();
  const withoutPrefix = trimmed.replace(/^(phone|tel|연락처)\s*:\s*/i, '').trim();
  const digits = withoutPrefix.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return withoutPrefix || trimmed;
}

/**
 * 팀 연락처 배열(contacts)을 한 줄 문자열로. type 접두사 없이 값만, 전화번호는 3-4-4 포맷
 */
export function formatContactsDisplay(
  items: Array<{ type?: string; value?: string }>
): string {
  if (!Array.isArray(items) || items.length === 0) return '-';
  return items
    .map((c) => formatContactValue(c.value ?? '-'))
    .filter((s) => s !== '-')
    .join(', ') || '-';
}
