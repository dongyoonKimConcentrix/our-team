'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

type TeamOption = {
  id: string;
  name: string;
  age_range: string | null;
  skill_level: string | null;
  contacts: Array<{ type?: string; value?: string }>;
};

type StadiumOption = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
};

/** 연락처 값만 010-1234-1234 형식으로 포맷 (표시용) */
function formatPhoneDisplay(raw: string | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

/** 입력 중 연락처에 하이픈 자동 삽입 (010-1234-5678 형식) */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.startsWith('010')) {
    if (digits.length <= 7) return `010-${digits.slice(3)}`;
    return `010-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  return digits.slice(0, 11);
}

export default function NewMatchPage() {
  const router = useRouter();
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  /** 새 팀으로 등록할 때 입력하는 나이·실력·연락처·블랙리스트 (기존 팀 선택 시에는 사용 안 함) */
  const [newTeamAge, setNewTeamAge] = useState('');
  const [newTeamSkill, setNewTeamSkill] = useState('');
  const [newTeamContact, setNewTeamContact] = useState('');
  const [newTeamBlacklist, setNewTeamBlacklist] = useState(false);
  const [stadiums, setStadiums] = useState<StadiumOption[]>([]);
  const [matchDate, setMatchDate] = useState('');
  const [stadiumId, setStadiumId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const callyPopoverRef = useRef<HTMLDivElement>(null);
  const callyRef = useRef<HTMLElement & { value?: string }>(null);

  const searchTeams = useCallback(async (q: string) => {
    const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (Array.isArray(data)) setTeamOptions(data as TeamOption[]);
  }, []);

  useEffect(() => {
    searchTeams(teamInput);
  }, [teamInput, searchTeams]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stadiums')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const seen = new Set<string>();
          const unique = (data as StadiumOption[]).filter((s) => {
            const key = (s.name ?? '').trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setStadiums(unique);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Cally 달력 change → state 반영 + popover 닫기 */
  useEffect(() => {
    const el = callyRef.current;
    const popover = callyPopoverRef.current;
    if (!el || !popover) return;
    const onChange = () => {
      const value = el.value ?? '';
      setMatchDate(value);
      if (typeof popover.hidePopover === 'function') popover.hidePopover();
    };
    el.addEventListener('change', onChange);
    return () => el.removeEventListener('change', onChange);
  }, []);

  const filteredTeams = teamInput.trim()
    ? teamOptions.filter((t) => t.name.toLowerCase().includes(teamInput.trim().toLowerCase()))
    : teamOptions.slice(0, 10);

  const handleSubmitMatch = async () => {
    if (!matchDate || !stadiumId) {
      setSubmitError('날짜와 구장을 선택해주세요.');
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      let teamId: string | undefined = selectedTeam?.id;
      if (!teamId && teamInput.trim()) {
        const createRes = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: teamInput.trim(),
            age_range: newTeamAge.trim() || null,
            skill_level: newTeamSkill.trim() || null,
            contacts: newTeamContact.trim()
              ? [{ type: 'phone', value: newTeamContact.trim().replace(/\D/g, '') }]
              : [],
            is_blacklisted: newTeamBlacklist,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || '팀 등록 실패');
        teamId = createData.id;
      }
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_date: matchDate,
          stadium_id: stadiumId,
          team_id: teamId,
          owner_team_id: teamId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록 실패');
      router.push('/admin/match');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '등록 실패');
    } finally {
      setSubmitLoading(false);
    }
  };

  const matchDateLabel = matchDate
    ? `${matchDate.slice(0, 4)}년 ${parseInt(matchDate.slice(5, 7), 10)}월 ${parseInt(matchDate.slice(8, 10), 10)}일`
    : '날짜 선택';

  return (
    <>
      <Script src="https://unpkg.com/cally" strategy="afterInteractive" type="module" />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">매칭 등록</h1>
        <p className="text-base-content/70 text-sm mb-6">
          날짜와 구장만 먼저 등록할 수 있습니다. 상대팀은 나중에 매칭 목록에서 수정할 수 있습니다.
        </p>

      <div className="card bg-base-200 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base text-base-content">매칭 일시 · 구장</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">매칭 날짜</span>
              </label>
              <button
                type="button"
                className="input input-bordered w-full text-left"
                {...({ popovertarget: 'cally-popover-match' } as React.ButtonHTMLAttributes<HTMLButtonElement>)}
                id="cally-trigger-match"
                style={{ anchorName: '--cally-trigger-match' } as React.CSSProperties}
              >
                {matchDateLabel}
              </button>
              <div
                ref={callyPopoverRef}
                popover="auto"
                id="cally-popover-match"
                className="dropdown bg-base-100 rounded-box shadow-lg p-2"
                style={{ positionAnchor: '--cally-trigger-match' } as React.CSSProperties}
              >
                <calendar-date
                  ref={callyRef}
                  class="cally w-full bg-base-100 border border-base-300 rounded-box"
                  value={matchDate}
                  locale="ko-KR"
                >
                  {/* @ts-expect-error Cally slot */}
                  <svg aria-label="Previous" className="fill-current size-4" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  {/* @ts-expect-error Cally slot */}
                  <svg aria-label="Next" className="fill-current size-4" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                  <calendar-month />
                </calendar-date>
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">구장</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={stadiumId}
                onChange={(e) => setStadiumId(e.target.value)}
              >
                <option value="">선택</option>
                {stadiums.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {submitError && (
            <p className="text-error text-sm mt-2">{submitError}</p>
          )}
          <div className="card-actions justify-start mt-2">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleSubmitMatch}
              disabled={submitLoading}
            >
              {submitLoading ? '등록 중…' : '매칭 등록'}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base text-base-content/80">상대팀</h2>
          <p className="text-base-content/60 text-sm">기존 팀을 선택하거나, 팀명을 입력해 새 팀으로 등록할 수 있습니다. 새 팀이면 나이·실력을 입력하세요.</p>
          <div className="flex flex-col gap-4">
            <div className="form-control relative" ref={autocompleteRef}>
              <label className="label">
                <span className="label-text">팀명 검색 / 입력</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="기존 팀 선택 또는 새 팀명 입력"
                value={selectedTeam ? selectedTeam.name : teamInput}
                onChange={(e) => {
                  setSelectedTeam(null);
                  setTeamInput(e.target.value);
                  setAutocompleteOpen(true);
                }}
                onFocus={() => setAutocompleteOpen(true)}
              />
              {autocompleteOpen && filteredTeams.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-box bg-base-100 border border-base-300 shadow-lg max-h-60 overflow-auto">
                  {filteredTeams.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-base-200"
                        onClick={() => {
                          setSelectedTeam(t);
                          setTeamInput(t.name);
                          setAutocompleteOpen(false);
                        }}
                      >
                        {t.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedTeam ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">나이</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered read-only"
                    value={selectedTeam.age_range ?? ''}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">실력</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered read-only"
                    value={selectedTeam.skill_level ?? ''}
                    readOnly
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">연락처</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered read-only"
                    value={
                      Array.isArray(selectedTeam.contacts) && selectedTeam.contacts.length
                        ? selectedTeam.contacts
                            .map((c) => formatPhoneDisplay(c.value))
                            .filter(Boolean)
                            .join(', ') || '-'
                        : '-'
                    }
                    readOnly
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">나이 (새 팀일 때)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="예: 30대중반"
                    value={newTeamAge}
                    onChange={(e) => setNewTeamAge(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">실력 (새 팀일 때)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="예: 하하"
                    value={newTeamSkill}
                    onChange={(e) => setNewTeamSkill(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">연락처 (새 팀일 때)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="010-1234-5678"
                    value={newTeamContact}
                    onChange={(e) => setNewTeamContact(formatPhoneInput(e.target.value))}
                    inputMode="numeric"
                    maxLength={13}
                  />
                </div>
                <div className="form-control sm:col-span-3">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-error"
                      checked={newTeamBlacklist}
                      onChange={(e) => setNewTeamBlacklist(e.target.checked)}
                    />
                    <span className="label-text">블랙리스트</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
