import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server';

/** 매칭 목록 (관리자용, 최신순) */
export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 500);
  const supabase = createServerSupabaseClient();
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      stadium_id,
      our_team_attendance,
      created_at,
      stadiums ( id, name )
    `)
    .order('match_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (matchError) return Response.json({ error: matchError.message }, { status: 500 });
  const matchIds = (matches ?? []).map((m) => m.id);
  if (matchIds.length === 0) return Response.json(matches ?? []);
  const { data: matchTeams } = await supabase
    .from('match_teams')
    .select('match_id, team_id, teams ( id, name, age_range, skill_level, contacts )')
    .in('match_id', matchIds);
  type TeamRow = { id: string; name: string; age_range: string | null; skill_level: string | null; contacts: Array<{ type?: string; value?: string }> };
  const teamByMatch = new Map<string, TeamRow>();
  for (const row of matchTeams ?? []) {
    const mid = (row as { match_id: string }).match_id;
    const t = (row as { teams: TeamRow | null }).teams;
    if (mid && t) teamByMatch.set(mid, t);
  }
  const list = (matches ?? []).map((m) => ({
    id: m.id,
    match_date: m.match_date,
    stadium_id: m.stadium_id,
    stadium_name: (m.stadiums as { name: string } | null)?.name ?? null,
    our_team_attendance: m.our_team_attendance,
    created_at: m.created_at,
    team: m.id ? teamByMatch.get(m.id) ?? null : null,
  }));
  return Response.json(list);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    match_date,
    stadium_id,
    our_team_attendance,
    weather,
    team_id,
    owner_team_id,
  } = body as {
    match_date: string;
    stadium_id: string;
    our_team_attendance?: number;
    weather?: { temp_c?: number; humidity?: number; clouds?: string };
    team_id?: string;
    owner_team_id?: string;
  };
  if (!match_date || !stadium_id) {
    return Response.json({ error: 'match_date, stadium_id가 필요합니다.' }, { status: 400 });
  }
  let supabaseAdmin;
  try {
    supabaseAdmin = createServerSupabaseAdminClient();
  } catch {
    return Response.json({ error: '서버 설정이 없습니다.' }, { status: 500 });
  }
  const { data: match, error: matchError } = await supabaseAdmin
    .from('matches')
    .insert({
      match_date,
      stadium_id,
      our_team_attendance: our_team_attendance ?? 0,
      weather: weather ?? {},
      owner_team_id: owner_team_id || null,
    })
    .select('id')
    .single();
  if (matchError) return Response.json({ error: matchError.message }, { status: 400 });
  if (team_id && match?.id) {
    await supabaseAdmin.from('match_teams').insert({
      match_id: match.id,
      team_id,
      owner_team_id: owner_team_id || null,
    });
  }
  return Response.json({ id: match?.id });
}
