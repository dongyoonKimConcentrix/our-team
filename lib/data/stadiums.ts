import { createClient } from '@/lib/supabase/client';
import type { StadiumWithCoords } from '@/lib/types';

export async function getStadiumsWithCoords(): Promise<StadiumWithCoords[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stadiums_with_coords')
    .select('id, name, address, owner_team_id, lat, lng')
    .order('name');

  if (error) throw error;
  return (data ?? []) as StadiumWithCoords[];
}
