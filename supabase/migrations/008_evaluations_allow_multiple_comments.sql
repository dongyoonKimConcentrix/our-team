-- 같은 사용자가 같은 팀·같은 매칭에 여러 코멘트를 남길 수 있도록 유니크 제약 제거
ALTER TABLE public.evaluations
  DROP CONSTRAINT IF EXISTS evaluations_evaluator_id_target_team_id_match_id_key;
