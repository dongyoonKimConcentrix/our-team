# 팀 매칭 관리 서비스

Next.js 14 (App Router) + MUI v6 + Naver Maps API + Supabase PostGIS 기반 지도/매칭 관리 앱입니다.

## 기능

- **테마**: 다크/라이트 모드, 브랜드 컬러(Primary/Secondary), Material Design 3 스타일, Pretendard·Noto Sans KR 폰트
- **로그인**: `/login` — MUI Container, Grid2, Box 반응형 레이아웃
- **관리자**: `/admin`, `/admin/map` — 헤더, 지도 탭, 테마 토글
- **지도**: `/admin/map` — DB 구장(stadiums) 좌표를 마커로 표시, 마커 클릭 시 해당 구장에서 매칭한 팀 목록 팝업, 팀 이름 클릭 시 `/team/[id]` 이동
- **팀 상세**: `/team/[id]` — 팀 정보 표시

## 환경 설정

1. `.env.local` 생성 후 아래 변수 설정 (참고: `.env.example`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Naver Maps (네이버 클라우드 플랫폼, 웹 동적 지도용 Client ID)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your-ncp-client-id
```

2. Supabase에 마이그레이션 적용

- `supabase/migrations/001_initial_schema.sql` — 테이블·RLS·트리거
- `supabase/migrations/002_stadiums_coords_and_match_teams.sql` — `stadiums_with_coords` 뷰, `match_teams` 테이블

3. 구장 데이터: `stadiums` 테이블에 `location`(PostGIS Point)이 있어야 지도에 마커가 표시됩니다. `match_teams`에 매칭별 팀을 넣어야 팝업에 팀 목록이 나옵니다.

### 정적 데이터 → DB 동기화

`lib/data/match-history-merged.ts`가 최신일 때, 이 데이터를 기준으로 DB(teams, stadiums, matches, match_teams)를 채우려면:

```bash
# .env.local 의 Supabase 변수 로드 후 실행 (또는 export 후 실행)
npm run sync-merged
```

- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 또는 `SUPABASE_SERVICE_ROLE_KEY`
- DB 직접 쓰기 권한이 필요하면 `SUPABASE_SERVICE_ROLE_KEY` 사용 권장

## 실행

```bash
npm install
npm run dev
```

- 홈: http://localhost:3000  
- 로그인: http://localhost:3000/login  
- 지도: http://localhost:3000/admin/map  

## 기술 스택

- Next.js 14 (App Router), TypeScript
- MUI (Material UI) v6 — ThemeProvider, CssBaseline, M3 스타일
- react-naver-maps — Naver Maps API
- Supabase (PostgreSQL + PostGIS)
