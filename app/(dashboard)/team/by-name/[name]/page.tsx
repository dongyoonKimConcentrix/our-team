import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Params = { name: string };

export default async function TeamByNamePage({ params }: { params: Promise<Params> | Params }) {
  const resolved = typeof (params as Promise<Params>).then === 'function' ? await (params as Promise<Params>) : (params as Params);
  const name = decodeURIComponent(resolved.name).trim();
  if (!name) notFound();

  const supabase = createServerSupabaseClient();

  // 1) 정확히 일치하는 팀명
  const { data: exact } = await supabase
    .from('teams')
    .select('id')
    .eq('name', name)
    .limit(1);
  let team = exact?.[0];

  // 2) 없으면 팀명이 검색어를 포함하는 경우 (예: 이력 "아스팔" → DB "FC아스팔", "좀비" → "좀비FC")
  if (!team) {
    const { data: partial } = await supabase
      .from('teams')
      .select('id')
      .ilike('name', `%${name}%`)
      .limit(1);
    team = partial?.[0];
  }

  if (!team) notFound();
  redirect(`/team/${team.id}`);
}
