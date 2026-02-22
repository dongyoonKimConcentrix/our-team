'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { getMatchHistoryByDate, getDatesWithMatchHistory } from '@/lib/data/match-history-merged';
import type { MatchHistoryMergedItem } from '@/lib/data/match-history-merged';
import { formatContactValue, formatContactsDisplay } from '@/lib/format-contact';
import { formatDateKo } from '@/lib/format-date';
import MatchWeather from '@/components/MatchWeather';

dayjs.locale('ko');

/** Date → YYYY-MM-DD */
function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** API 매칭 한 건을 홈 캘린더용 아이템으로 변환 */
function apiMatchToMergedItem(m: {
  id: string;
  match_date: string;
  stadium_name: string | null;
  team: { id: string; name: string; age_range?: string | null; skill_level?: string | null; contacts?: Array<{ type?: string; value?: string }> } | null;
}): MatchHistoryMergedItem {
  const team = m.team;
  const contact = team?.contacts?.length
    ? formatContactsDisplay(team.contacts)
    : '-';
  return {
    date: m.match_date,
    teamName: team?.name ?? '-',
    stadium: m.stadium_name ?? '-',
    contact,
    age: team?.age_range ?? '-',
    skill: team?.skill_level ?? '-',
    weather: {},
  };
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  /** API에서 가져온 매칭 목록 (관리자 등록분) */
  const [apiMatches, setApiMatches] = useState<Array<{
    id: string;
    match_date: string;
    stadium_name: string | null;
    team: { id: string; name: string; age_range?: string | null; skill_level?: string | null; contacts?: Array<{ type?: string; value?: string }> } | null;
  }>>([]);
  /** 매칭 데이터 로드 완료 후에만 달력 그리기 (has-match 등 class가 안정적으로 붙도록) */
  const [matchDataReady, setMatchDataReady] = useState(false);
  /** Cally가 getDayParts를 읽도록 캘린더를 한 번 리마운트 (key 변경) */
  const [calendarKey, setCalendarKey] = useState(0);
  const calendarRef = useRef<HTMLElement & { value?: string; getDayParts?: (date: Date) => string }>(null);

  /** API 매칭 목록 로드 (캘린더 점 + 날짜별 목록용). 로드 완료 후 달력 렌더 허용 */
  useEffect(() => {
    let cancelled = false;
    fetch('/api/matches?limit=300')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (!cancelled && Array.isArray(data)) setApiMatches(data as typeof apiMatches);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMatchDataReady(true);
      });
    return () => { cancelled = true; };
  }, []);

  /** 매칭 이력이 있는 날짜 집합 (캘린더 점 표시용) = 정적 데이터 + API 매칭 날짜 */
  const datesWithMatches = useMemo(() => {
    const set = new Set(getDatesWithMatchHistory());
    apiMatches.forEach((m) => m.match_date && set.add(m.match_date));
    return set;
  }, [apiMatches]);

  /** 매칭이 있는 날짜 중 최신 날짜 (YYYY-MM-DD). 디폴트 선택용 */
  const latestMatchDate = useMemo(() => {
    if (datesWithMatches.size === 0) return null;
    const sorted = Array.from(datesWithMatches).sort();
    return sorted[sorted.length - 1] ?? null;
  }, [datesWithMatches]);

  /** 오늘 날짜 YYYY-MM-DD (미래/과거 구분용) */
  const todayYMD = useMemo(() => toYMD(new Date()), []);

  /** 사용자가 달력에서 날짜를 직접 선택했는지 (선택 시 디폴트 자동 갱신 안 함) */
  const userHasSelectedDate = useRef(false);

  /** 디폴트 선택: 매칭이 있는 최신 날짜. API 로드 전에는 정적 기준, 로드 후 최신으로 한 번 갱신 */
  useEffect(() => {
    if (latestMatchDate && !userHasSelectedDate.current) {
      setSelectedDate(latestMatchDate);
    }
  }, [latestMatchDate]);

  /** 선택일 기준 라벨·섹션 class (한 번에 계산해 항상 동일하게 적용) */
  const sectionMeta = useMemo(() => {
    if (!selectedDate) return null;
    const matchTime = dayjs(selectedDate).hour(20).minute(0).second(0).millisecond(0);
    const isScheduled = dayjs().isBefore(matchTime);
    const label = isScheduled ? '매칭 예정' : '매칭 이력';
    const sectionClass = `mb-6 home-date-match-section ${isScheduled ? 'match-section--scheduled' : 'match-section--history'}`;
    return { label, sectionClass };
  }, [selectedDate]);

  /** Cally getDayParts: 과거 매칭일은 'has-match'(주황), 미래 매칭일은 'has-future-match'(파란) */
  const getDayParts = useCallback(
    (date: Date) => {
      const ymd = toYMD(date);
      if (!datesWithMatches.has(ymd)) return '';
      return ymd < todayYMD ? 'has-match' : 'has-future-match';
    },
    [datesWithMatches, todayYMD]
  );

  /** 캘린더 ref: 붙을 때 getDayParts + change 리스너 설정, 떨어질 때 리스너 제거 */
  const setCalendarRef = useCallback(
    (el: HTMLElement | null) => {
      const prev = calendarRef.current;
      if (prev && prev !== el) {
        prev.removeEventListener('change', (prev as unknown as { _onChange?: () => void })._onChange!);
      }
      (calendarRef as React.MutableRefObject<HTMLElement | null>).current = el;
      if (el) {
        (el as HTMLElement & { getDayParts?: (date: Date) => string }).getDayParts = getDayParts;
        const onChange = () => {
          userHasSelectedDate.current = true;
          const value = (el as HTMLElement & { value?: string }).value;
          setSelectedDate(value ?? null);
        };
        (el as unknown as { _onChange?: () => void })._onChange = onChange;
        el.addEventListener('change', onChange);
      }
    },
    [getDayParts]
  );

  /** 캘린더에서 선택한 날짜의 매칭 이력. 과거는 정적만(중복 방지), 오늘·미래는 정적+API */
  const dateMatchHistory = useMemo((): MatchHistoryMergedItem[] => {
    if (!selectedDate) return [];
    const staticItems = getMatchHistoryByDate(selectedDate);
    if (selectedDate < todayYMD) return staticItems;
    const fromApi = apiMatches
      .filter((m) => m.match_date === selectedDate)
      .map(apiMatchToMergedItem);
    return [...staticItems, ...fromApi];
  }, [selectedDate, apiMatches, todayYMD]);

  /** Cally가 getDayParts를 읽도록 한 번 리마운트 */
  useEffect(() => {
    const t = setTimeout(() => setCalendarKey((k) => k + 1), 100);
    return () => clearTimeout(t);
  }, []);

  /** 리마운트 후 Cally가 렌더한 뒤에도 getDayParts 유지 (has-match 점 표시) */
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;
    const apply = () => {
      (el as HTMLElement & { getDayParts?: (date: Date) => string }).getDayParts = getDayParts;
    };
    apply();
    const t1 = setTimeout(apply, 200);
    const t2 = setTimeout(apply, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [calendarKey, getDayParts]);

  return (
    <>
      <Script
        src="https://unpkg.com/cally"
        strategy="afterInteractive"
        type="module"
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Home</h1>
        <p className="text-base-content text-sm mb-6">
          FS Juntos에 오신 것을 환영합니다.
        </p>

        {/* 점 설명: 주황 = 과거 매칭 이력, 파란 = 예정된 매칭 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/80 mb-3">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#f97316]" aria-hidden />
            <span>과거 매칭 이력</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#67aa24]" aria-hidden />
            <span>예정된 매칭</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm bg-blue-500" aria-hidden />
            <span>오늘</span>
          </span>
        </div>

        {/* 매칭 데이터 로드 후에만 달력 렌더 (has-match 등 class 안정 적용) */}
        {!matchDataReady ? (
          <div className="cally w-full bg-base-100 border border-base-300 shadow-lg rounded-box mb-6 min-h-[280px] flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <calendar-date
            key={calendarKey}
            ref={setCalendarRef}
            class="cally w-full bg-base-100 border border-base-300 shadow-lg rounded-box mb-6"
            value={selectedDate ?? ''}
            locale="ko-KR"
          >
            {/* @ts-expect-error slot은 Cally 웹 컴포넌트용 */}
            <svg aria-label="Previous" className="fill-current size-4" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {/* @ts-expect-error slot은 Cally 웹 컴포넌트용 */}
            <svg aria-label="Next" className="fill-current size-4" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <calendar-month />
          </calendar-date>
        )}

        {/* 선택한 날짜의 매칭 팀 (20시 기준: 현재가 20시 이전이면 '매칭 예정', 이후면 '매칭 이력') */}
        {sectionMeta && selectedDate && (
          <div
            key={selectedDate}
            className={sectionMeta.sectionClass}
            data-label={sectionMeta.label}
          >
            <h2 className="text-lg font-semibold mb-3">
              {dayjs(selectedDate).format('YYYY년 MM월 DD일')} {sectionMeta.label}
            </h2>
            {dateMatchHistory.length === 0 ? (
              <p className="text-base-content text-sm">해당 날짜 {sectionMeta.label}이 없습니다.</p>
            ) : (
              <ul className="menu bg-base-100 rounded-box w-full text-left items-start gap-2">
                {dateMatchHistory.map((m, i) => (
                  <li key={`${m.date}-${m.teamName}-${i}`} className="w-full [&>*]:text-left rounded-box overflow-hidden">
                    <div className="flex flex-col py-2 px-3 items-start w-full bg-base-200 rounded-box [li.active_&]:!bg-base-200 [li.active_&]:!text-base-content [&:active]:!bg-base-200 [&:active]:!text-base-content">
                      <span className="text-sm text-base-content">매칭날짜 : {formatDateKo(m.date)}</span>
                      <MatchWeather date={m.date} fallback={m.weather} />
                      <span className="text-base-content text-sm">
                        구장 : {m.stadium && m.stadium !== '-' ? (
                          <Link href={`/map?stadium=${encodeURIComponent(m.stadium)}`} className="link font-bold">{m.stadium}</Link>
                        ) : (
                          (m.stadium || '-')
                        )}
                      </span>
                      <span className="font-bold flex items-center gap-2 flex-wrap">
                        팀명 : <Link href={`/team?name=${encodeURIComponent(m.teamName)}`} className="link">{m.teamName}</Link>
                        {m.isBlacklisted && <span className="badge badge-neutral badge-sm">블랙리스트</span>}
                      </span>
                      <span className="text-base-content text-sm">연락처: {formatContactValue(m.contact)}</span>
                      <span className="text-base-content text-sm">나이: {m.age ?? '-'}</span>
                      <span className="text-base-content text-sm">실력: {m.skill ?? '-'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
