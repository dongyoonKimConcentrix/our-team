import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string }> };

/** 매칭 단건 조회 (수정 폼용) */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return Response.json({ error: 'id 필요' }, { status: 400 });
  const supabase = createServerSupabaseClient();
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      stadium_id,
      our_team_attendance,
      stadiums ( id, name )
    `)
    .eq('id', id)
    .single();
  if (matchError || !match) return Response.json({ error: matchError?.message ?? 'Not found' }, { status: 404 });
  const { data: matchTeams } = await supabase
    .from('match_teams')
    .select('team_id, teams ( id, name, age_range, skill_level, contacts )')
    .eq('match_id', id)
    .limit(1);
  type TeamRow = {
    team_id: string;
    teams: { id: string; name: string; age_range: string | null; skill_level: string | null; contacts: Array<{ type?: string; value?: string }> } | null;
  };
  const first = (matchTeams ?? [])[0] as unknown as TeamRow | undefined;
  const t = first?.teams;
  const stadiums = match.stadiums as unknown as { name: string } | { name: string }[] | null;
  const stadiumName = stadiums == null ? null : Array.isArray(stadiums) ? stadiums[0]?.name : stadiums.name;
  return Response.json({
    id: match.id,
    match_date: match.match_date,
    stadium_id: match.stadium_id,
    stadium_name: stadiumName ?? null,
    our_team_attendance: match.our_team_attendance,
    team_id: t?.id ?? null,
    team_name: t?.name ?? null,
    team_age_range: t?.age_range ?? null,
    team_skill_level: t?.skill_level ?? null,
    team_contacts: t?.contacts ?? [],
  });
}

/** 매칭 수정 (날짜, 구장, 참석인원, 상대팀) */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return Response.json({ error: 'id 필요' }, { status: 400 });
  const body = await request.json();
  const {
    match_date,
    stadium_id,
    our_team_attendance,
    team_id,
    owner_team_id,
  } = body as {
    match_date?: string;
    stadium_id?: string;
    our_team_attendance?: number;
    team_id?: string | null;
    owner_team_id?: string | null;
  };
  let supabaseAdmin;
  try {
    supabaseAdmin = createServerSupabaseAdminClient();
  } catch {
    return Response.json({ error: '서버 설정이 없습니다.' }, { status: 500 });
  }
  const updates: { match_date?: string; stadium_id?: string; our_team_attendance?: number; owner_team_id?: string | null } = {};
  if (match_date != null) updates.match_date = match_date;
  if (stadium_id != null) updates.stadium_id = stadium_id;
  if (our_team_attendance != null) updates.our_team_attendance = Math.max(0, our_team_attendance);
  if (owner_team_id !== undefined) updates.owner_team_id = owner_team_id || null;
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabaseAdmin.from('matches').update(updates).eq('id', id);
    if (updateError) return Response.json({ error: updateError.message }, { status: 400 });
  }
  const { data: existing } = await supabaseAdmin.from('match_teams').select('team_id').eq('match_id', id).limit(1).maybeSingle();
  const currentTeamId = (existing as { team_id: string } | null)?.team_id ?? null;
  if (currentTeamId !== (team_id ?? null)) {
    await supabaseAdmin.from('match_teams').delete().eq('match_id', id);
    if (team_id) {
      await supabaseAdmin.from('match_teams').insert({
        match_id: id,
        team_id,
        owner_team_id: owner_team_id || null,
      });
    }
  }
  return Response.json({ ok: true });
}

/** 매칭 삭제 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return Response.json({ error: 'id 필요' }, { status: 400 });
  try {
    const supabaseAdmin = createServerSupabaseAdminClient();
    const { error } = await supabaseAdmin.from('matches').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: '서버 설정이 없습니다.' }, { status: 500 });
  }
}
