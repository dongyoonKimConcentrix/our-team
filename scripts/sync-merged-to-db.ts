/**
 * match-history-merged.ts 기준으로 DB 동기화
 * - 팀(teams): 팀명 유니크 기준 upsert (나이/실력/연락처/블랙리스트는 해당 팀의 최신 매칭 row 기준)
 * - 구장(stadiums): 구장명 유니크 기준 없으면 insert (주소/좌표 없음)
 * - 매칭(matches): (날짜, 구장) 유니크 기준 없으면 insert
 * - 매칭팀(match_teams): (매칭, 팀) 연결 insert (이미 있으면 무시)
 *
 * 실행: npm run sync-merged (프로젝트 루트에서 .env.local 자동 로드)
 */

import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { MATCH_HISTORY_MERGED, type MatchHistoryMergedItem } from '../lib/data/match-history-merged';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
'';

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY( 또는 SUPABASE_SERVICE_ROLE_KEY ) 설정 필요');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrCreateTeam(m: MatchHistoryMergedItem): Promise<string> {
  const name = m.teamName.trim();
  const { data: existing } = await supabase.from('teams').select('id').eq('name', name).limit(1).maybeSingle();
  if (existing?.id) return existing.id;
  const contacts =
    m.contact && m.contact !== '-'
      ? [{ type: 'phone', value: m.contact }]
      : [];
  const { data: inserted, error } = await supabase
    .from('teams')
    .insert({
      name,
      age_range: m.age !== '-' ? m.age : null,
      skill_level: m.skill !== '-' ? m.skill : null,
      contacts,
      is_blacklisted: m.isBlacklisted ?? false,
    })
    .select('id')
    .single();
  if (error) throw new Error(`팀 insert 실패 (${name}): ${error.message}`);
  return inserted!.id;
}

async function getOrCreateStadium(stadiumName: string): Promise<string> {
  const name = stadiumName.trim();
  const { data: existing } = await supabase.from('stadiums').select('id').eq('name', name).limit(1).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: inserted, error } = await supabase.from('stadiums').insert({ name }).select('id').single();
  if (error) throw new Error(`구장 insert 실패 (${name}): ${error.message}`);
  return inserted!.id;
}

async function getOrCreateMatch(matchDate: string, stadiumId: string, weather: MatchHistoryMergedItem['weather']): Promise<string> {
  const { data: existing } = await supabase
    .from('matches')
    .select('id')
    .eq('match_date', matchDate)
    .eq('stadium_id', stadiumId)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data: inserted, error } = await supabase
    .from('matches')
    .insert({
      match_date: matchDate,
      stadium_id: stadiumId,
      our_team_attendance: 0,
      weather: weather && (weather.temp_c != null || weather.humidity != null || weather.clouds)
        ? { temp_c: weather.temp_c, humidity: weather.humidity, clouds: weather.clouds }
        : {},
    })
    .select('id')
    .single();
  if (error) throw new Error(`매칭 insert 실패 (${matchDate}): ${error.message}`);
  return inserted!.id;
}

async function ensureMatchTeam(matchId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('match_teams')
    .upsert({ match_id: matchId, team_id: teamId }, { onConflict: 'match_id,team_id', ignoreDuplicates: true });
  if (error) throw new Error(`match_teams insert 실패: ${error.message}`);
}

async function main() {
  console.log('match-history-merged.ts 기준 DB 동기화 시작. 행 수:', MATCH_HISTORY_MERGED.length);

  const teamIds = new Map<string, string>();
  const stadiumIds = new Map<string, string>();

  // (date, stadium) 별로 그룹 → 해당 날짜/구장에 나온 팀명 목록
  const groupKey = (date: string, stadium: string) => `${date}|${stadium.trim()}`;
  const groups = new Map<string, { date: string; stadium: string; teams: MatchHistoryMergedItem[] }>();

  for (const m of MATCH_HISTORY_MERGED) {
    const key = groupKey(m.date, m.stadium);
    if (!groups.has(key)) groups.set(key, { date: m.date, stadium: m.stadium.trim(), teams: [] });
    const g = groups.get(key)!;
    if (!g.teams.some((t) => t.teamName.trim() === m.teamName.trim())) g.teams.push(m);
  }

  for (const [, { date, stadium, teams }] of groups) {
    const stadiumId = stadiumIds.get(stadium) ?? (await getOrCreateStadium(stadium));
    stadiumIds.set(stadium, stadiumId);

    const first = teams[0];
    const weather = first?.weather;
    const matchId = await getOrCreateMatch(date, stadiumId, weather);

    for (const m of teams) {
      const name = m.teamName.trim();
      let teamId = teamIds.get(name);
      if (!teamId) {
        teamId = await getOrCreateTeam(m);
        teamIds.set(name, teamId);
      }
      await ensureMatchTeam(matchId, teamId);
    }
  }

  console.log('동기화 완료.');
  console.log('  팀:', teamIds.size, '구장:', stadiumIds.size, '매칭 그룹:', groups.size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
