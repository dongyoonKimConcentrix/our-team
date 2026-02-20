'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { getMatchHistoryByDate } from '@/lib/data/match-history-merged';
import type { MatchHistoryMergedItem } from '@/lib/data/match-history-merged';
import { formatContactsDisplay } from '@/lib/format-contact';

const PAGE_SIZE = 5;

type MatchItem = {
  id: string;
  match_date: string;
  stadium_id: string;
  stadium_name: string | null;
  our_team_attendance: number;
  created_at: string;
  team: {
    id: string;
    name: string;
    age_range?: string | null;
    skill_level?: string | null;
    contacts?: Array<{ type?: string; value?: string }>;
  } | null;
};

function normalizeStadium(s: string): string {
  return (s ?? '').replace(/\s+/g, '');
}

/** 과거 매칭 정적 데이터에서 같은 날짜·구장인 상대팀 정보 반환 */
function getPastMatchByDateStadium(date: string, stadiumName: string | null): MatchHistoryMergedItem | null {
  if (!date || !stadiumName) return null;
  const key = normalizeStadium(stadiumName);
  const dayItems = getMatchHistoryByDate(date);
  return dayItems.find((m) => normalizeStadium(m.stadium) === key) ?? null;
}

export default function AdminMatchListPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<HTMLUListElement>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matches?limit=50');
      const data = await res.json();
      if (Array.isArray(data)) setMatches(data);
      else setMatches([]);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 매칭을 삭제할까요?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      await fetchMatches();
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(day, 10)}일`;
  };

  /** 검색어로 필터: 날짜(숫자), 구장명, 상대팀명(API 또는 과거 이력) */
  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) => {
      const past = getPastMatchByDateStadium(m.match_date, m.stadium_name ?? '');
      const teamName = m.team?.name ?? past?.teamName ?? '';
      const stadium = (m.stadium_name ?? '').toLowerCase();
      const dateNorm = m.match_date.replace(/-/g, '');
      const qNorm = q.replace(/\s/g, '').replace(/-/g, '');
      return (
        dateNorm.includes(qNorm) ||
        stadium.includes(q) ||
        teamName.toLowerCase().includes(q)
      );
    });
  }, [matches, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / PAGE_SIZE));
  const pageIndex = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedMatches = useMemo(
    () => filteredMatches.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE),
    [filteredMatches, pageIndex]
  );

  const scrollToList = () => {
    setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">매칭 목록</h1>
      <p className="text-base-content/70 text-sm mb-4">
        등록된 매칭을 수정하거나 삭제할 수 있습니다.
      </p>

      <div className="form-control mb-4">
        <input
          type="text"
          placeholder="날짜, 구장명, 상대팀명으로 검색"
          className="input input-bordered w-full max-w-md"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : matches.length === 0 ? (
        <p className="text-base-content/70">등록된 매칭이 없습니다.</p>
      ) : filteredMatches.length === 0 ? (
        <p className="text-base-content/70">검색 결과가 없습니다.</p>
      ) : (
        <>
          <ul ref={listRef} className="space-y-3 scroll-mt-20">
            {paginatedMatches.map((m) => {
            const past = getPastMatchByDateStadium(m.match_date, m.stadium_name ?? '');
            const teamName = m.team?.name ?? past?.teamName ?? '상대 미정';
            const age = m.team?.age_range ?? past?.age ?? '-';
            const skill = m.team?.skill_level ?? past?.skill ?? '-';
            const contact = m.team?.contacts?.length
              ? formatContactsDisplay(m.team.contacts)
              : (past?.contact ?? '-');
            return (
              <li key={m.id} className="card bg-base-200 shadow-sm">
                <div className="card-body py-3 px-4 flex flex-col gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold">{formatDate(m.match_date)}</span>
                      <span className="text-base-content/70">·</span>
                      <span>{m.stadium_name ?? '(구장)'}</span>
                    </div>
                    <div className="text-sm space-y-0.5">
                      <p>
                        <span className="text-base-content/70">상대 </span>
                        <span className="font-medium">{teamName}</span>
                      </p>
                      <p className="text-base-content/70">
                        나이 {age} · 실력 {skill}
                      </p>
                      <p className="text-base-content/70">
                        연락처 {contact}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-base-300">
                    <Link href={`/admin/match/${m.id}/edit`} className="btn btn-sm btn-primary">
                      수정
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-error"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id ? '삭제 중…' : '삭제'}
                    </button>
                  </div>
                </div>
              </li>
            );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <p className="text-sm text-base-content/70">
              전체 {filteredMatches.length}건
              {searchQuery.trim() ? ` (검색 결과)` : ''}
            </p>
            <div className="join">
              <button
                type="button"
                className="join-item btn btn-sm"
                disabled={pageIndex <= 1}
                onClick={() => {
                  setCurrentPage(1);
                  scrollToList();
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
                  scrollToList();
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
                  scrollToList();
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
                  scrollToList();
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

      <div className="mt-6 flex justify-end">
        <Link href="/admin/match/new" className="btn btn-primary">
          매칭 등록
        </Link>
      </div>
    </div>
  );
}
