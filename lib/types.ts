export type StadiumWithCoords = {
  id: string;
  name: string;
  address: string | null;
  owner_team_id: string | null;
  lat: number;
  lng: number;
};

export type Team = {
  id: string;
  name: string;
  age_range: string | null;
  skill_level: string | null;
  is_blacklisted: boolean;
};

export type TeamWithMatchCount = Team & { match_count?: number };
