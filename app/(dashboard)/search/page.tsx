'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatContactsDisplay } from '@/lib/format-contact';

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
  const [results, setResults] = useState<SearchTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      const res = await fetch(`/api/search/teams?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '검색 실패');
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (!mounted) return;
    fetchResults();
  }, [mounted, debouncedQuery, fetchResults]);

  const contactsText = (c: SearchTeam['contacts']) => {
    if (!Array.isArray(c) || !c.length) return '-';
    return formatContactsDisplay(c);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">통합 검색</h1>
      <p className="text-base-content text-sm mb-6">
        팀명, 구장명, 연락처로 검색하세요.
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
          </div>
        </div>
      </div>

      {debouncedQuery && (
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
          <h2 className="text-lg card-title">검색 결과</h2>
          <p className="text-base-content/80 text-sm">팀명 선택시 해당 팀의 상세정보를 확인할 수 있습니다.</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : (
            <ul className="menu bg-base-100 rounded-box w-full text-left items-start">
              {results.map((team) => (
                <li key={team.id} className="w-full [&>*]:text-left border-b border-[#ddd] last:border-b-0 bg-base-200/40">
                  <Link
                    href={`/team/${team.id}`}
                    className="flex flex-col py-2 px-3 items-start w-full [li.active_&]:!bg-base-200/60 [li.active_&]:!text-base-content [&:active]:!bg-base-200/60 [&:active]:!text-base-content hover:bg-base-200/60"
                  >
                    <span className="font-bold flex items-center gap-2 flex-wrap">
                      팀명 : <span className="link link-hover">{team.name}</span>
                      {team.is_blacklisted && <span className="badge badge-neutral badge-sm">블랙리스트</span>}
                    </span>
                    <span className="text-base-content/80 text-sm">연락처: {contactsText(team.contacts)}</span>
                    <span className="text-base-content/80 text-sm">나이: {team.age_range ?? '-'}</span>
                    <span className="text-base-content/80 text-sm">실력: {team.skill_level ?? '-'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loading && results.length === 0 && (
            <p className="text-base-content text-sm">검색 결과가 없습니다.</p>
          )}
        </div>
        </div>
      )}

      {mounted && !debouncedQuery && (
        <p className="text-base-content/60 text-sm">검색어를 입력해보세요.</p>
      )}
    </div>
  );
}
