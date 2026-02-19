-- 팀명·구장명·연락처 통합 검색 + 특정 날짜 매칭 팀 필터 (ilike 부분 일치)
CREATE OR REPLACE FUNCTION public.search_teams(
  search_query text DEFAULT NULL,
  filter_date date DEFAULT NULL
)
RETURNS SETOF public.teams
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.id, t.name, t.age_range, t.skill_level, t.contacts, t.is_blacklisted, t.owner_team_id, t.created_at, t.updated_at
  FROM public.teams t
  LEFT JOIN public.match_teams mt ON mt.team_id = t.id
  LEFT JOIN public.matches m ON m.id = mt.match_id
  LEFT JOIN public.stadiums s ON s.id = m.stadium_id
  WHERE (
    (search_query IS NULL OR trim(search_query) = '')
    OR (t.name ILIKE '%' || trim(search_query) || '%')
    OR (t.contacts::text ILIKE '%' || trim(search_query) || '%')
    OR (s.name ILIKE '%' || trim(search_query) || '%')
  )
  AND (
    filter_date IS NULL
    OR (m.id IS NOT NULL AND m.match_date = filter_date)
  )
  ORDER BY t.name;
END;
$$;

COMMENT ON FUNCTION public.search_teams IS '팀명/구장명/연락처 ilike 검색, 선택 시 해당 날짜에 매칭한 팀만 필터';
