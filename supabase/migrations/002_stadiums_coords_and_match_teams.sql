-- 구장 좌표 뷰 (PostGIS geometry → lat/lng) + 매칭-팀 연결 테이블

-- 매칭에 참여한 팀 (구장별 매칭 팀 리스트 조회용)
CREATE TABLE IF NOT EXISTS public.match_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  owner_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, team_id)
);

CREATE INDEX idx_match_teams_match_id ON public.match_teams(match_id);
CREATE INDEX idx_match_teams_team_id ON public.match_teams(team_id);

-- 구장 좌표 뷰 (WGS84: ST_Y=위도, ST_X=경도)
CREATE OR REPLACE VIEW public.stadiums_with_coords AS
SELECT
  s.id,
  s.name,
  s.address,
  s.owner_team_id,
  s.created_at,
  s.updated_at,
  ST_Y(s.location::geometry) AS lat,
  ST_X(s.location::geometry) AS lng
FROM public.stadiums s
WHERE s.location IS NOT NULL;

ALTER TABLE public.match_teams ENABLE ROW LEVEL SECURITY;
