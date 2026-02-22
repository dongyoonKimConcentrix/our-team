-- 별점은 team_ratings에서 1인 1팀당 최신 1건으로 관리. 코멘트는 evaluations에서 rating 없이 등록 가능.

-- 1) evaluations.rating nullable (코멘트만 남길 수 있도록)
ALTER TABLE public.evaluations
  DROP CONSTRAINT IF EXISTS evaluations_rating_check;
ALTER TABLE public.evaluations
  ALTER COLUMN rating DROP NOT NULL;
ALTER TABLE public.evaluations
  ADD CONSTRAINT evaluations_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- 2) 팀별 별점: (evaluator_id, target_team_id) 당 1행, 갱신 시 업데이트
CREATE TABLE public.team_ratings (
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (evaluator_id, target_team_id)
);

COMMENT ON TABLE public.team_ratings IS '팀별 별점. 1인 1팀당 최신 1건만 유지, 갱신 가능';

CREATE INDEX idx_team_ratings_target_team_id ON public.team_ratings(target_team_id);

ALTER TABLE public.team_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read team_ratings"
  ON public.team_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own team_rating"
  ON public.team_ratings FOR INSERT
  WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "Users can update own team_rating"
  ON public.team_ratings FOR UPDATE
  USING (auth.uid() = evaluator_id)
  WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "Users can delete own team_rating"
  ON public.team_ratings FOR DELETE
  USING (auth.uid() = evaluator_id);

-- 3) 기존 evaluations에서 팀별 최신 rating만 team_ratings로 이관 (rating이 있는 행만)
INSERT INTO public.team_ratings (evaluator_id, target_team_id, rating, updated_at)
SELECT DISTINCT ON (evaluator_id, target_team_id) evaluator_id, target_team_id, rating, created_at
  FROM public.evaluations
  WHERE rating IS NOT NULL
  ORDER BY evaluator_id, target_team_id, created_at DESC
ON CONFLICT (evaluator_id, target_team_id) DO NOTHING;
