import type { Team } from '@/lib/types';

/**
 * 해당 구장에서 매칭했던 팀 목록 (match_teams 기준).
 * 브라우저에서는 /api/stadiums/[stadiumId]/teams 경유로 호출해
 * Supabase 직접 접속(ERR_QUIC_PROTOCOL_ERROR 등)을 피합니다.
 */
export async function getTeamsByStadiumId(stadiumId: string): Promise<Team[]> {
  if (typeof window === 'undefined') {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();
    const { data: matchIds, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('stadium_id', stadiumId);
    if (matchError) throw matchError;
    if (!matchIds?.length) return [];
    const ids = matchIds.map((m) => m.id);
    const { data: matchTeams, error: mtError } = await supabase
      .from('match_teams')
      .select('team_id')
      .in('match_id', ids);
    if (mtError) throw mtError;
    const uniqueTeamIds = Array.from(new Set((matchTeams ?? []).map((mt) => mt.team_id)));
    if (uniqueTeamIds.length === 0) return [];
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, age_range, skill_level, is_blacklisted')
      .in('id', uniqueTeamIds)
      .order('name');
    if (teamsError) throw teamsError;
    return (teams ?? []) as Team[];
  }
  const base = window.location.origin;
  const res = await fetch(`${base}/api/stadiums/${encodeURIComponent(stadiumId)}/teams`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `팀 목록 조회 실패 (${res.status})`);
  }
  const data = await res.json();
  return (data ?? []) as Team[];
}
