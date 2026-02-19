import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  const supabase = createServerSupabaseClient();
  const { data: match, error: matchError } = await supabase
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
    await supabase.from('match_teams').insert({
      match_id: match.id,
      team_id,
      owner_team_id: owner_team_id || null,
    });
  }
  return Response.json({ id: match?.id });
}
