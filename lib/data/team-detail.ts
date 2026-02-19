import type { SupabaseClient } from '@supabase/supabase-js';

export type MannerScorePoint = {
  matchDate: string;
  matchId: string;
  score: number;
  label: string;
};

export type MatchHistoryItem = {
  id: string;
  match_date: string;
  stadium_name: string;
  weather: { temp_c?: number; humidity?: number; clouds?: string } | null;
};

export type EvaluationWithEvaluator = {
  id: string;
  match_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  evaluator_id: string;
  evaluator_name: string | null;
  evaluator_is_active: boolean | null;
  evaluator_deleted_at: string | null;
};

/** 최근 5경기 매너 점수(평균 별점) 추이 */
export async function getTeamMannerScoresLast5(
  supabase: SupabaseClient,
  teamId: string
): Promise<MannerScorePoint[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('match_id, rating, matches(match_date)')
    .eq('target_team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) return [];

  type Row = {
    match_id: string;
    rating: number;
    matches: { match_date: string } | { match_date: string }[] | null;
  };
  const rows = (data ?? []) as Row[];

  const byMatch = new Map<string, { sum: number; count: number; date: string }>();
  for (const r of rows) {
    const match = r.matches;
    const date = Array.isArray(match) ? match[0]?.match_date ?? '' : match?.match_date ?? '';
    const cur = byMatch.get(r.match_id);
    if (cur) {
      cur.sum += r.rating;
      cur.count += 1;
    } else {
      byMatch.set(r.match_id, { sum: r.rating, count: 1, date });
    }
  }

  const points: MannerScorePoint[] = Array.from(byMatch.entries())
    .map(([matchId, v]) => ({
      matchId,
      matchDate: v.date,
      score: Math.round((v.sum / v.count) * 10) / 10,
      label: v.date ? new Date(v.date + 'Z').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-',
    }))
    .sort((a, b) => b.matchDate.localeCompare(a.matchDate))
    .slice(0, 5)
    .reverse();

  return points;
}

/** 팀의 매칭 이력 (날짜, 구장, 날씨) */
export async function getTeamMatchHistory(
  supabase: SupabaseClient,
  teamId: string
): Promise<MatchHistoryItem[]> {
  const { data: matchIds, error: idError } = await supabase
    .from('match_teams')
    .select('match_id')
    .eq('team_id', teamId);

  if (idError || !matchIds?.length) return [];

  const ids = matchIds.map((r) => r.match_id);
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, match_date, weather, stadiums(name)')
    .in('id', ids)
    .order('match_date', { ascending: false });

  if (error) return [];

  type MatchRow = {
    id: string;
    match_date: string;
    weather: MatchHistoryItem['weather'];
    stadiums: { name: string } | { name: string }[] | null;
  };
  const list = (matches ?? []) as MatchRow[];
  return list.map((m) => {
    const stadium = m.stadiums;
    const name = Array.isArray(stadium) ? stadium[0]?.name : stadium?.name;
    return {
      id: m.id,
      match_date: m.match_date,
      stadium_name: name ?? '-',
      weather: m.weather,
    };
  });
}

/** 팀에 대한 평가(코멘트) 목록 + 평가자 프로필 (탈퇴 여부) */
export async function getTeamEvaluationsWithEvaluator(
  supabase: SupabaseClient,
  teamId: string
): Promise<EvaluationWithEvaluator[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, match_id, rating, comment, created_at, evaluator_id, profiles(name, is_active, deleted_at)')
    .eq('target_team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) {
    const fallback = await supabase
      .from('evaluations')
      .select('id, match_id, rating, comment, created_at, evaluator_id')
      .eq('target_team_id', teamId)
      .order('created_at', { ascending: false });
    if (fallback.error) return [];
    const withProfiles: EvaluationWithEvaluator[] = [];
    for (const row of fallback.data ?? []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, is_active, deleted_at')
        .eq('id', row.evaluator_id)
        .single();
      withProfiles.push({
        ...row,
        evaluator_name: profile?.name ?? null,
        evaluator_is_active: profile?.is_active ?? null,
        evaluator_deleted_at: profile?.deleted_at ?? null,
      });
    }
    return withProfiles;
  }

  type Row = {
    id: string;
    match_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    evaluator_id: string;
    profiles: { name: string | null; is_active: boolean | null; deleted_at: string | null } | { name: string | null; is_active: boolean | null; deleted_at: string | null }[] | null;
  };
  const list = (data ?? []) as Row[];
  return list.map((r) => {
    const p = r.profiles;
    const profile = Array.isArray(p) ? p[0] : p;
    return {
      id: r.id,
      match_id: r.match_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      evaluator_id: r.evaluator_id,
      evaluator_name: profile?.name ?? null,
      evaluator_is_active: profile?.is_active ?? null,
      evaluator_deleted_at: profile?.deleted_at ?? null,
    };
  });
}
