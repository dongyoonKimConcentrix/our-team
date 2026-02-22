import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/** 팀 생성 (관리자 매칭 등록에서 새 상대팀 등록용) */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, age_range, skill_level, contacts, is_blacklisted } = body as {
    name: string;
    age_range?: string | null;
    skill_level?: string | null;
    contacts?: Array<{ type?: string; value?: string }>;
    is_blacklisted?: boolean;
  };
  const trimmedName = (name ?? '').trim();
  if (!trimmedName) {
    return Response.json({ error: '팀명이 필요합니다.' }, { status: 400 });
  }
  const supabase = createServerSupabaseClient();
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name: trimmedName,
      age_range: age_range?.trim() || null,
      skill_level: skill_level?.trim() || null,
      contacts: Array.isArray(contacts) ? contacts : [],
      is_blacklisted: Boolean(is_blacklisted),
    })
    .select('id, name')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(team);
}
