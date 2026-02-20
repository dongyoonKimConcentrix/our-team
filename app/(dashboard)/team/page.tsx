import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getMatchHistoryByTeamName } from '@/lib/data/match-history-merged';
import { formatDateKo } from '@/lib/format-date';

type Props = { searchParams: Promise<{ name?: string }> | { name?: string } };

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

export default async function TeamPage({ searchParams }: Props) {
  const resolved = typeof (searchParams as Promise<{ name?: string }>).then === 'function'
    ? await (searchParams as Promise<{ name?: string }>)
    : (searchParams as { name?: string });
  const name = resolved.name?.trim();
  if (!name) {
    redirect('/map');
  }

  const decodedName = decodeURIComponent(name);
  const supabase = createServerSupabaseClient();

  const { data: exact } = await supabase
    .from('teams')
    .select('id')
    .eq('name', decodedName)
    .limit(1);
  let team = exact?.[0];

  if (!team) {
    const { data: partial } = await supabase
      .from('teams')
      .select('id')
      .ilike('name', `%${decodedName}%`)
      .limit(1);
    team = partial?.[0];
  }

  if (team) {
    redirect(`/team/${team.id}`);
  }

  // DB에 없어도 매칭 이력(정적 데이터)에 있으면 매칭 이력만 표시
  const matchHistory = getMatchHistoryByTeamName(decodedName);
  if (matchHistory.length > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-200 shadow-sm mb-6">
          <div className="card-body">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl font-bold">{decodedName}</h1>
              <span className="badge badge-ghost">미등록 팀</span>
            </div>
            <p className="text-sm text-base-content/70">
              이 팀은 아직 팀 등록 정보가 없습니다. 매칭 이력만 표시됩니다.
            </p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base mb-4">매칭 이력</h2>
            <ul className="timeline timeline-vertical">
              {matchHistory.map((m, i) => (
                <li key={`${m.date}-${m.stadium}-${m.teamName}`}>
                  {i > 0 && <hr />}
                  <div className="timeline-start">
                    {formatDateKo(m.date)}
                  </div>
                  <div className="timeline-middle">
                    <CheckIcon />
                  </div>
                  <div className="timeline-end timeline-box">{m.stadium}</div>
                  {i < matchHistory.length - 1 && <hr />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      <p className="text-base-content/80 mb-4">해당 이름(&quot;{decodedName}&quot;)의 팀을 찾을 수 없습니다.</p>
      <Link href="/map" className="btn btn-primary btn-sm">지도로 돌아가기</Link>
    </div>
  );
}
