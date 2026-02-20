'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getMatchHistoryByStadium } from '@/lib/data/match-history-merged';
import { formatContactValue } from '@/lib/format-contact';
import { formatDateKo } from '@/lib/format-date';
import MatchWeather from '@/components/MatchWeather';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] min-h-[400px] flex items-center justify-center bg-base-200 rounded-xl">
      <span className="loading loading-spinner loading-lg text-primary" />
      <span className="ml-2 text-base-conten">지도 로딩 중...</span>
    </div>
  ),
});

const PAGE_SIZE = 5;

export default function MapPage() {
  const [selectedStadiumName, setSelectedStadiumName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const matchHistory = useMemo(
    () => (selectedStadiumName ? getMatchHistoryByStadium(selectedStadiumName) : []),
    [selectedStadiumName]
  );

  const totalPages = Math.max(1, Math.ceil(matchHistory.length / PAGE_SIZE));
  const pageIndex = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = useMemo(
    () => matchHistory.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE),
    [matchHistory, pageIndex]
  );

  const matchHistoryRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStadiumSelect = useCallback((name: string | null) => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
    setSelectedStadiumName(name);
    setCurrentPage(1);
    if (name) {
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        matchHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  return (
    <div className="max-w-full">
      <h1 className="text-2xl font-bold mb-1">구장 지도</h1>
      <p className="text-base-conten text-sm mb-4">
        지도는 훼릭스 풋살클럽 기준입니다. 마커를 클릭하면 구장명이 표시되고, 아래에 해당 구장 매칭 이력이 최신순으로 나옵니다.
      </p>

      <div className="w-full rounded-xl overflow-hidden">
        <StadiumMap onStadiumSelect={handleStadiumSelect} />
      </div>

      {selectedStadiumName && (
        <div ref={matchHistoryRef} className="mt-6 scroll-mt-20">
          <div className="card bg-base-200 rounded-xl shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg">
                매칭 이력 — {selectedStadiumName}
              </h2>
              <p className="text-base-content/80 text-sm">팀명 선택시 해당 팀의 상세정보를 확인할 수 있습니다.</p>
              {matchHistory.length === 0 ? (
                <p className="text-base-content text-sm">해당 구장 매칭 이력이 없습니다.</p>
              ) : (
                <>
                  <ul className="menu bg-base-100 rounded-box w-full text-left items-start">
                    {paginatedItems.map((m) => (
                        <li key={`${m.date}-${m.teamName}`} className="w-full [&>*]:text-left border-b border-[#ddd] last:border-b-0">
                          <div className="flex flex-col py-2 items-start w-full [li.active_&]:!bg-base-100 [li.active_&]:!text-base-content [&:active]:!bg-base-100 [&:active]:!text-base-content">
                            <span className="text-sm text-base-conten">매칭날짜 : {formatDateKo(m.date)}</span>
                            <MatchWeather date={m.date} fallback={m.weather} />
                            <span className="font-bold flex items-center gap-2 flex-wrap">
                              팀명 : <Link href={`/team?name=${encodeURIComponent(m.teamName)}`} className="link link-hover">{m.teamName}</Link>
                              {m.isBlacklisted && <span className="badge badge-neutral badge-sm">블랙리스트</span>}
                            </span>
                            <span className="text-base-content text-sm">연락처: {formatContactValue(m.contact)}</span>
                            <span className="text-base-content text-sm">나이: {m.age ?? '-'}</span>
                            <span className="text-base-content text-sm">실력: {m.skill ?? '-'}</span>
                          </div>
                        </li>
                      ))}
                  </ul>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-base-conten">
                      전체 <b>{matchHistory.length}</b>건
                    </p>
                    <div className="join">
                      <button
                        type="button"
                        className="join-item btn btn-sm"
                        disabled={pageIndex <= 1}
                        onClick={() => {
                          setCurrentPage(1);
                          setTimeout(() => {
                            matchHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 0);
                        }}
                        aria-label="처음"
                        title="처음"
                      >
                        &#171;
                      </button>
                      <button
                        type="button"
                        className="join-item btn btn-sm"
                        disabled={pageIndex <= 1}
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          setTimeout(() => {
                            matchHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 0);
                        }}
                        aria-label="이전"
                        title="이전"
                      >
                        &#8249;
                      </button>
                      <span className="join-item btn btn-sm no-animation">
                        {pageIndex} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="join-item btn btn-sm"
                        disabled={pageIndex >= totalPages}
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          setTimeout(() => {
                            matchHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 0);
                        }}
                        aria-label="다음"
                        title="다음"
                      >
                        &#8250;
                      </button>
                      <button
                        type="button"
                        className="join-item btn btn-sm"
                        disabled={pageIndex >= totalPages}
                        onClick={() => {
                          setCurrentPage(totalPages);
                          setTimeout(() => {
                            matchHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 0);
                        }}
                        aria-label="마지막"
                        title="마지막"
                      >
                        &#187;
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
