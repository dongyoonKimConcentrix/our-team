-- 팀 목록/상세는 지도·검색·상세 페이지에서 익명(anon) 읽기 허용
CREATE POLICY "Allow public read for teams"
  ON public.teams
  FOR SELECT
  USING (true);
