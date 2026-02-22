-- evaluations 테이블 RLS 정책
-- 조회: 모든 사용자(비로그인 포함) 허용
-- 등록/수정/삭제: 본인(evaluator_id = auth.uid())만 허용

CREATE POLICY "Anyone can read evaluations"
  ON public.evaluations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own evaluation"
  ON public.evaluations FOR INSERT
  WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "Users can update own evaluation"
  ON public.evaluations FOR UPDATE
  USING (auth.uid() = evaluator_id)
  WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "Users can delete own evaluation"
  ON public.evaluations FOR DELETE
  USING (auth.uid() = evaluator_id);
