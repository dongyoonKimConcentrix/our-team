import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getTeamMatchHistory,
  getTeamEvaluationsWithEvaluator,
  getTeamRatingsSummary,
} from '@/lib/data/team-detail';
import { getMatchHistoryByTeamName } from '@/lib/data/match-history-merged';
import { formatContactsDisplay } from '@/lib/format-contact';
import { formatDateKo } from '@/lib/format-date';
import TeamCommentSection from '@/components/TeamCommentSection';
import TeamRatingSection from '@/components/TeamRatingSection';

type MatchHistoryDisplayItem = { id: string; match_date: string; stadium_name: string };

type Params = { id: string };

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default async function TeamDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, age_range, skill_level, is_blacklisted, contacts, created_at')
    .eq('id', id)
    .single();

  if (error || !team) notFound();

  const [matchHistoryFromDb, evaluations, ratingsSummary] = await Promise.all([
    getTeamMatchHistory(supabase, id),
    getTeamEvaluationsWithEvaluator(supabase, id),
    getTeamRatingsSummary(supabase, id),
  ]);

  // DB에 매칭 이력이 없으면 지도/검색과 동일한 정적 데이터(match-history-merged)로 표시
  const matchHistory: MatchHistoryDisplayItem[] =
    matchHistoryFromDb.length > 0
      ? matchHistoryFromDb.map((m) => ({ id: m.id, match_date: m.match_date, stadium_name: m.stadium_name }))
      : getMatchHistoryByTeamName(team.name).map((m) => ({
          id: `${m.date}-${m.stadium}-${m.teamName}`,
          match_date: m.date,
          stadium_name: m.stadium,
        }));

  const contacts = Array.isArray(team.contacts) ? team.contacts : [];
  const contactItems = contacts as Array<{ type?: string; value?: string }>;
  const contactDisplay = formatContactsDisplay(contactItems);

  return (
    <div className="max-w-2xl mx-auto">

      <div className="card bg-base-200 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.is_blacklisted && (
              <span className="badge badge-error">블랙리스트</span>
            )}
          </div>
          <p className="text-sm text-base-content font-bold">연락처</p>
          <p>{contactDisplay}</p>
          <p className="text-sm text-base-content font-bold">나이</p>
          <p>{team.age_range ?? '-'}</p>
          <p className="text-sm text-base-content font-bold">실력</p>
          <p>{team.skill_level ?? '-'}</p>
        </div>
      </div>

      <TeamRatingSection teamId={id} summary={ratingsSummary} />

      <div className="card bg-base-200 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base mb-4">매칭 이력</h2>
          {matchHistory.length === 0 ? (
            <p className="text-sm text-base-content/70">매칭 이력이 없습니다.</p>
          ) : (
            <ul className="timeline timeline-vertical">
              {matchHistory.map((m, i) => (
                <li key={m.id}>
                  {i > 0 && <hr />}
                  <div className="timeline-start">
                    {formatDateKo(m.match_date)}
                  </div>
                  <div className="timeline-middle">
                    <CheckIcon />
                  </div>
                  <div className="timeline-end timeline-box">{m.stadium_name}</div>
                  {i < matchHistory.length - 1 && <hr />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <TeamCommentSection
        evaluations={evaluations}
        teamId={id}
        firstMatchId={matchHistoryFromDb.length > 0 ? matchHistoryFromDb[0].id : null}
      />
    </div>
  );
}
