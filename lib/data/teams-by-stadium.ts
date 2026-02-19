import { createClient } from '@/lib/supabase/client';
import type { Team } from '@/lib/types';

/**
 * 해당 구장에서 매칭했던 팀 목록 (match_teams 기준)
 */
export async function getTeamsByStadiumId(stadiumId: string): Promise<Team[]> {
  const supabase = createClient();
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
