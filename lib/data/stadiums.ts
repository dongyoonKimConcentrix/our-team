import type { StadiumWithCoords } from '@/lib/types';

/**
 * 구장 목록(좌표 포함) 조회.
 * 브라우저에서는 /api/stadiums 경유(서버가 Supabase 호출)로 해서
 * ERR_CONNECTION_RESET(방화벽 등으로 Supabase 직접 접속 불가)을 피합니다.
 */
export async function getStadiumsWithCoords(): Promise<StadiumWithCoords[]> {
  if (typeof window === 'undefined') {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('stadiums_with_coords')
      .select('id, name, address, owner_team_id, lat, lng')
      .order('name');
    if (error) throw error;
    return (data ?? []) as StadiumWithCoords[];
  }
  const base = window.location.origin;
  const res = await fetch(`${base}/api/stadiums`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `구장 목록 조회 실패 (${res.status})`);
  }
  const data = await res.json();
  return (data ?? []) as StadiumWithCoords[];
}
