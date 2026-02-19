import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('teams')
    .select('id, name, age_range, skill_level, contacts')
    .order('name')
    .limit(20);
  if (q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}
