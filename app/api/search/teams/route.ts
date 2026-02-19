import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const dateStr = request.nextUrl.searchParams.get('date'); // YYYY-MM-DD or empty
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc('search_teams', {
    search_query: q.trim() || null,
    filter_date: dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : null,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}
