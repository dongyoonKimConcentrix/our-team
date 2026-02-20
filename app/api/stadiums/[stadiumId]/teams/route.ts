import { createServerSupabaseClient } from '@/lib/supabase/server';

/** 해당 구장에서 매칭했던 팀 목록 (match_teams 기준). 브라우저→Supabase 직접 호출 회피용 */
export async function GET(
  _request: Request,
  { params }: { params: { stadiumId: string } }
) {
  const { stadiumId } = params;
  if (!stadiumId) return Response.json({ error: 'stadiumId 필요' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data: matchIds, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('stadium_id', stadiumId);

  if (matchError) return Response.json({ error: matchError.message }, { status: 500 });
  if (!matchIds?.length) return Response.json([]);

  const ids = matchIds.map((m) => m.id);
  const { data: matchTeams, error: mtError } = await supabase
    .from('match_teams')
    .select('team_id')
    .in('match_id', ids);

  if (mtError) return Response.json({ error: mtError.message }, { status: 500 });
  const uniqueTeamIds = Array.from(new Set((matchTeams ?? []).map((mt) => mt.team_id)));
  if (uniqueTeamIds.length === 0) return Response.json([]);

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, age_range, skill_level, is_blacklisted')
    .in('id', uniqueTeamIds)
    .order('name');

  if (teamsError) return Response.json({ error: teamsError.message }, { status: 500 });
  return Response.json(teams ?? []);
}
