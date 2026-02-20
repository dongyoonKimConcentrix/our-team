import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    return Response.json(
      { error: 'Supabase가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.' },
      { status: 503 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('stadiums_with_coords')
      .select('id, name, address, owner_team_id, lat, lng')
      .order('name');

    if (error) {
      console.error('[api/stadiums] Supabase error:', error.message, error.details);
      return Response.json(
        { error: error.message || '구장 목록 조회 실패' },
        { status: 500 }
      );
    }
    return Response.json(data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : '구장 목록 조회 중 오류가 발생했습니다.';
    console.error('[api/stadiums]', err);
    return Response.json({ error: message }, { status: 500 });
  }
}
