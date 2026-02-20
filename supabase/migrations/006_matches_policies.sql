-- 매칭·매칭팀 테이블은 조회만 익명 허용 (쓰기는 API에서 service role 사용)
CREATE POLICY "Allow public read for matches"
  ON public.matches
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read for match_teams"
  ON public.match_teams
  FOR SELECT
  USING (true);
