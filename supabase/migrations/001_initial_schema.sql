-- ============================================
-- 매칭 관리 서비스 DB 스키마 (PostgreSQL + PostGIS)
-- Next.js + Supabase
-- ============================================

-- PostGIS 확장 (geometry 타입 사용)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. teams (profiles.owner_team_id FK 때문에 먼저 생성)
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age_range TEXT,                    -- e.g. '20대', '30-40대'
  skill_level TEXT,                  -- e.g. '초급', '중급', '상급'
  contacts JSONB DEFAULT '[]'::jsonb, -- [{ "type": "phone", "value": "010-1234-5678" }, ...]
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  owner_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.teams.contacts IS '연락처 배열. type, value 등 키 사용';
COMMENT ON COLUMN public.teams.owner_team_id IS '확장성: 소유 팀(멀티테넌시 등)';

-- ============================================
-- 2. profiles (Soft Delete 지원)
-- ============================================
-- Supabase auth.users와 연동. 팀원 탈퇴 시 레코드 유지, team_members에서만 연결 제거.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  owner_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.profiles.is_active IS 'false + deleted_at 설정 시 탈퇴 처리. evaluations/이름은 유지';
COMMENT ON COLUMN public.profiles.deleted_at IS '탈퇴 시점. 설정 시 is_active=false 권장';

-- ============================================
-- 3. team_members (팀-프로필 연결, 탈퇴 시 여기서만 제거)
-- ============================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_team_id UUID REFERENCES public.teams(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,              -- 탈퇴 시점 기록용 (선택)
  UNIQUE (team_id, profile_id)
);

COMMENT ON TABLE public.team_members IS '탈퇴 시 이 테이블에서만 행 삭제 또는 left_at 설정. profiles/evaluations 유지';

-- ============================================
-- 4. stadiums (PostGIS geometry)
-- ============================================
CREATE TABLE public.stadiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  location geometry(Point, 4326),   -- WGS84
  owner_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.stadiums.location IS 'PostGIS Point (위도, 경도). SRID 4326 = WGS84';

-- ============================================
-- 5. matches
-- ============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date DATE NOT NULL,
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE RESTRICT,
  our_team_attendance INT NOT NULL DEFAULT 0 CHECK (our_team_attendance >= 0),
  weather JSONB DEFAULT '{}'::jsonb, -- { "temp_c": 25, "humidity": 60, "clouds": "맑음" }
  owner_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.matches.weather IS '기온(temp_c), 습도(humidity), 구름(clouds) 등';

-- ============================================
-- 6. evaluations
-- ============================================
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  owner_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evaluator_id, target_team_id, match_id)
);

COMMENT ON TABLE public.evaluations IS '평가자(evaluator_id)는 탈퇴해도 레코드 유지. profiles.name으로 표시';

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_profiles_owner_team_id ON public.profiles(owner_team_id);
CREATE INDEX idx_profiles_is_active_deleted_at ON public.profiles(is_active, deleted_at);

CREATE INDEX idx_teams_owner_team_id ON public.teams(owner_team_id);
CREATE INDEX idx_teams_is_blacklisted ON public.teams(is_blacklisted);
CREATE INDEX idx_teams_contacts_gin ON public.teams USING gin(contacts);

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_profile_id ON public.team_members(profile_id);
CREATE INDEX idx_team_members_owner_team_id ON public.team_members(owner_team_id);

CREATE INDEX idx_stadiums_owner_team_id ON public.stadiums(owner_team_id);
CREATE INDEX idx_stadiums_location ON public.stadiums USING gist(location);

CREATE INDEX idx_matches_stadium_id ON public.matches(stadium_id);
CREATE INDEX idx_matches_match_date ON public.matches(match_date);
CREATE INDEX idx_matches_owner_team_id ON public.matches(owner_team_id);

CREATE INDEX idx_evaluations_evaluator_id ON public.evaluations(evaluator_id);
CREATE INDEX idx_evaluations_target_team_id ON public.evaluations(target_team_id);
CREATE INDEX idx_evaluations_match_id ON public.evaluations(match_id);
CREATE INDEX idx_evaluations_owner_team_id ON public.evaluations(owner_team_id);
CREATE INDEX idx_evaluations_created_at ON public.evaluations(created_at);

-- ============================================
-- RLS (Row Level Security) 예시
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 예: 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 예: owner_team_id 기준 팀 데이터 접근 (정책은 비즈니스에 맞게 추가)
-- CREATE POLICY "Team members can view team data"
--   ON public.teams FOR SELECT
--   USING (
--     owner_team_id IN (
--       SELECT team_id FROM public.team_members WHERE profile_id = auth.uid()
--     )
--   );

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER stadiums_updated_at
  BEFORE UPDATE ON public.stadiums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
