'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { getMatchHistoryByDate } from '@/lib/data/match-history-merged';
import { formatContactValue, formatContactsDisplay } from '@/lib/format-contact';

dayjs.locale('ko');

type SearchTeam = {
  id: string;
  name: string;
  age_range: string | null;
  skill_level: string | null;
  contacts: Array<{ type?: string; value?: string }> | null;
  is_blacklisted: boolean;
};

const DEBOUNCE_MS = 300;

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [results, setResults] = useState<SearchTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const calendarRef = useRef<HTMLElement & { value?: string }>(null);

  /** 캘린더에서 선택한 날짜의 매칭 이력 (match-history-merged.ts 기준) */
  const dateMatchHistory = selectedDate ? getMatchHistoryByDate(selectedDate) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  /** Cally 웹 컴포넌트는 shadow DOM 사용 → ref로 네이티브 change 리스너 등록 */
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;
    const onChange = () => {
      const value = (el as HTMLElement & { value?: string }).value;
      setSelectedDate(value ?? null);
    };
    el.addEventListener('change', onChange);
    return () => el.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (selectedDate) params.set('date', selectedDate);
      const res = await fetch(`/api/search/teams?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '검색 실패');
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedDate]);

  useEffect(() => {
    if (!mounted) return;
    fetchResults();
  }, [mounted, debouncedQuery, selectedDate, fetchResults]);

  const contactsText = (c: SearchTeam['contacts']) => {
    if (!Array.isArray(c) || !c.length) return '-';
    return formatContactsDisplay(c);
  };

  return (
    <>
      <Script
        src="https://unpkg.com/cally"
        strategy="afterInteractive"
        type="module"
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">통합 검색</h1>
        <p className="text-base-content/70 text-sm mb-6">
          팀명, 구장명, 연락처로 검색. 달력에서 날짜를 누르면 해당 날짜에 매칭한 팀이 아래에 표시됩니다.
        </p>

        <div className="flex flex-wrap gap-3 items-end mb-6">
          <div className="form-control flex-1 min-w-[200px]">
            <div className="join w-full">
              <input
                type="text"
                placeholder="팀명, 구장명, 연락처..."
                className="input input-bordered join-item flex-1"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="join-item btn btn-disabled no-animation">🔍</span>
            </div>
          </div>
        </div>

        {/* Cally 웹 컴포넌트 (change는 ref로 수신) */}
        <calendar-date
          ref={calendarRef}
          className="cally bg-base-100 border border-base-300 shadow-lg rounded-box mb-6"
          value={selectedDate ?? ''}
          locale="ko-KR"
        >
          {/* @ts-expect-error slot은 Cally 웹 컴포넌트용으로 SVG 표준 타입에 없음 */}
          <svg aria-label="Previous" className="fill-current size-4" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          {/* @ts-expect-error slot은 Cally 웹 컴포넌트용으로 SVG 표준 타입에 없음 */}
          <svg aria-label="Next" className="fill-current size-4" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <calendar-month />
        </calendar-date>

        {/* 선택한 날짜의 매칭 팀 (match-history-merged.ts 기준, 달력 아래) */}
        {selectedDate && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">
              {dayjs(selectedDate).format('YYYY년 MM월 DD일')} 매칭 이력
            </h2>
            {dateMatchHistory.length === 0 ? (
              <p className="text-base-content/70 text-sm">해당 날짜 매칭 이력이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {dateMatchHistory.map((m, i) => (
                  <li key={`${m.date}-${m.teamName}-${i}`}>
                    <div className={`card card-compact bg-base-200 shadow-sm border-l-4 ${m.isBlacklisted ? 'border-error' : 'border-transparent'}`}>
                      <div className="card-body py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">{m.teamName}</span>
                          {m.isBlacklisted && <span className="badge badge-error badge-sm">블랙리스트</span>}
                        </div>
                        <p className="text-sm text-base-content/60">
                          {formatContactValue(m.contact)}
                        </p>
                        <p className="text-sm text-base-content/70">
                          {m.stadium}
                        </p>
                        <p className="text-sm text-base-content/70">
                          {m.age !== '-' ? m.age : '-'} / {m.skill !== '-' ? m.skill : '-'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 검색 결과: 검색어 입력 또는 달력 날짜 선택 시에만 노출 */}
        {(debouncedQuery || selectedDate) && (
          <>
            <h2 className="text-lg font-semibold mb-3">검색 결과</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : (
              <ul className="space-y-2">
                {results.map((team) => (
                  <li key={team.id}>
                    <Link
                      href={`/team/${team.id}`}
                      className={`card card-compact bg-base-200 shadow-sm hover:bg-base-300 transition-colors border-l-4 ${
                        team.is_blacklisted ? 'border-error' : 'border-transparent'
                      }`}
                    >
                      <div className="card-body py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">{team.name}</span>
                          {team.is_blacklisted && (
                            <span className="badge badge-error badge-sm">블랙리스트</span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/60">
                          {contactsText(team.contacts)}
                        </p>
                        <p className="text-sm text-base-content/70">
                          {team.age_range ?? '-'} / {team.skill_level ?? '-'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!loading && results.length === 0 && (debouncedQuery || selectedDate) && (
              <p className="text-base-content/70 text-sm">검색 결과가 없습니다.</p>
            )}
          </>
        )}

        {mounted && !debouncedQuery && !selectedDate && (
          <p className="text-base-content/60 text-sm">검색어를 입력하거나 달력에서 날짜를 선택해보세요.</p>
        )}
      </div>
    </>
  );
}
