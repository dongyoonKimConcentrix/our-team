import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('stadiums_with_coords')
    .select('id, name, address, lat, lng')
    .order('name');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}
