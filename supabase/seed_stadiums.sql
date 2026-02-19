-- 구장 시드 (지도 마커/구장명 통일용). 모든 문자열은 반드시 작은따옴표로 감싸야 합니다.
-- 기존 구장이 있으면 먼저 삭제 후 삽입하거나, 아래 "구장명만 변경" 쿼리를 사용하세요.

-- 방법 1: 기존 데이터 없을 때 전체 삽입
INSERT INTO public.stadiums (id, name, address, location, owner_team_id)
VALUES
  (gen_random_uuid(), '강용풋살장', '경기도 고양시 덕양구 동송로 20', st_geogfromtext('POINT(126.8942 37.6496)')::geometry, NULL),
  (gen_random_uuid(), '로꼬풋살스타디움', '경기도 고양시 일산동구 중앙로 1036', st_geogfromtext('POINT(126.7897 37.6432)')::geometry, NULL),
  (gen_random_uuid(), '고양불스풋살파크', '경기 고양시 덕양구 오금동 379-1', st_geogfromtext('POINT(126.8935 37.6677)')::geometry, NULL),
  (gen_random_uuid(), '고양축구센터', '경기도 고양시 덕양구 흥도로 78', st_geogfromtext('POINT(126.8664 37.6165)')::geometry, NULL),
  (gen_random_uuid(), 'W풋살클럽', '경기 고양시 덕양구 내곡동 248-12', st_geogfromtext('POINT(126.8067 37.6415)')::geometry, NULL),
  (gen_random_uuid(), '도내동 풋살장', '경기 고양시 덕양구 흥도로132번길 106', st_geogfromtext('POINT(126.8658 37.6220)')::geometry, NULL),
  (gen_random_uuid(), '백두풋살장', '경기도 고양시 덕양구 서오릉로 654-35', st_geogfromtext('POINT(126.8699 37.6382)')::geometry, NULL),
  (gen_random_uuid(), '사커스토리', '경기도 고양시 일산서구 덕이로 310-2', st_geogfromtext('POINT(126.7456 37.6974)')::geometry, NULL),
  (gen_random_uuid(), '상암풋살장', '경기도 고양시 덕은로 8-7', st_geogfromtext('POINT(126.8765 37.5894)')::geometry, NULL),
  (gen_random_uuid(), '고양쌈바풋볼파크', '경기 고양시 덕양구 수역이길 42', st_geogfromtext('POINT(126.8497 37.6623)')::geometry, NULL),
  (gen_random_uuid(), '용두그린 풋살장', '경기도 고양시 덕양구 화랑로286번길 30', st_geogfromtext('POINT(126.8805 37.6212)')::geometry, NULL),
  (gen_random_uuid(), '고양팬텀 풋살장', '경기도 고양시 일산동구 성석동 1075-125', st_geogfromtext('POINT(126.7932 37.7143)')::geometry, NULL),
  (gen_random_uuid(), '풋볼아카데미', '경기도 고양시 덕양구 창릉동 225-17', st_geogfromtext('POINT(126.8840 37.6414)')::geometry, NULL),
  (gen_random_uuid(), '하늘숲 풋살파크', '고양시 일산동구 능안길 15', st_geogfromtext('POINT(126.8125 37.7025)')::geometry, NULL),
  (gen_random_uuid(), '풋살하늬 풋살장', '경기도 고양시 덕양구 대장길 88', st_geogfromtext('POINT(126.8245 37.6285)')::geometry, NULL),
  (gen_random_uuid(), '훼릭스 풋살클럽', '경기도 고양시 덕양구 성사동 1', st_geogfromtext('POINT(126.8615 37.6474)')::geometry, NULL);

-- 방법 2: 이미 구장 행이 있을 때 주소 기준으로 구장명만 변경 (Supabase SQL 에디터에서 이 블록만 실행)
/*
UPDATE public.stadiums SET name = '강용풋살장' WHERE address LIKE '%동송로 20%';
UPDATE public.stadiums SET name = '로꼬풋살스타디움' WHERE address LIKE '%중앙로 1036%';
UPDATE public.stadiums SET name = '고양불스풋살파크' WHERE address LIKE '%오금동 379-1%';
UPDATE public.stadiums SET name = '고양축구센터' WHERE address LIKE '%흥도로 78%';
UPDATE public.stadiums SET name = 'W풋살클럽' WHERE address LIKE '%내곡동 248-12%';
UPDATE public.stadiums SET name = '도내동 풋살장' WHERE address LIKE '%흥도로132번길 106%';
UPDATE public.stadiums SET name = '백두풋살장' WHERE address LIKE '%서오릉로 654-35%';
UPDATE public.stadiums SET name = '사커스토리' WHERE address LIKE '%덕이로 310-2%';
UPDATE public.stadiums SET name = '상암풋살장' WHERE address LIKE '%덕은로 8-7%';
UPDATE public.stadiums SET name = '고양쌈바풋볼파크' WHERE address LIKE '%수역이길 42%';
UPDATE public.stadiums SET name = '용두그린 풋살장' WHERE address LIKE '%화랑로286번길 30%';
UPDATE public.stadiums SET name = '고양팬텀 풋살장' WHERE address LIKE '%성석동 1075-125%' OR name = '팬텀스포츠아카데미';
UPDATE public.stadiums SET name = '풋볼아카데미' WHERE address LIKE '%창릉동 225-17%';
UPDATE public.stadiums SET name = '하늘숲 풋살파크' WHERE address LIKE '%능안길 15%';
UPDATE public.stadiums SET name = '풋살하늬 풋살장' WHERE address LIKE '%대장길 88%';
UPDATE public.stadiums SET name = '훼릭스 풋살클럽' WHERE address LIKE '%성사동 1%';
*/
