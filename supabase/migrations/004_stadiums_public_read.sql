-- 구장 목록은 지도/공개 조회용으로 익명(anon) 읽기 허용
CREATE POLICY "Allow public read for stadiums"
  ON public.stadiums
  FOR SELECT
  USING (true);
