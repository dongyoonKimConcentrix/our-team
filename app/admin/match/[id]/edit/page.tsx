'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [matchDate, setMatchDate] = useState('');
  const [stadiumId, setStadiumId] = useState('');
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  /** 새 팀으로 등록할 때 입력하는 나이·실력·연락처 (기존 팀 선택 시에는 사용 안 함) */
  const [newTeamAge, setNewTeamAge] = useState('');
  const [newTeamSkill, setNewTeamSkill] = useState('');
  const [newTeamContact, setNewTeamContact] = useState('');
  const [stadiums, setStadiums] = useState<StadiumOption[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const searchTeams = useCallback(async (q: string) => {
    const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (Array.isArray(data)) setTeamOptions(data as TeamOption[]);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/matches/${id}`).then((r) => r.json()),
      fetch('/api/stadiums').then((r) => r.json()),
    ]).then(([matchData, stadiumsData]) => {
      if (cancelled) return;
      if (matchData.error) {
        setLoading(false);
        return;
      }
      setMatchDate(matchData.match_date ?? '');
      setStadiumId(matchData.stadium_id ?? '');
      if (matchData.team_id && matchData.team_name) {
        setSelectedTeam({
          id: matchData.team_id,
          name: matchData.team_name,
          age_range: matchData.team_age_range ?? null,
          skill_level: matchData.team_skill_level ?? null,
          contacts: Array.isArray(matchData.team_contacts) ? matchData.team_contacts : [],
        });
        setTeamInput(matchData.team_name);
      }
      if (Array.isArray(stadiumsData)) {
        const seen = new Set<string>();
        const unique = (stadiumsData as StadiumOption[]).filter((s) => {
          const key = (s.name ?? '').trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setStadiums(unique);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    searchTeams(teamInput);
  }, [teamInput, searchTeams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTeams = teamInput.trim()
    ? teamOptions.filter((t) => t.name.toLowerCase().includes(teamInput.trim().toLowerCase()))
    : teamOptions.slice(0, 10);

  const handleSubmit = async () => {
    if (!id || !matchDate || !stadiumId) {
      setSubmitError('날짜와 구장을 선택해주세요.');
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      let teamId: string | null = selectedTeam?.id ?? null;
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
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error || '팀 등록 실패');
        teamId = createData.id ?? null;
      }
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_date: matchDate,
          stadium_id: stadiumId,
          team_id: teamId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      router.push('/admin/match');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('이 매칭을 삭제할까요? 삭제하면 복구할 수 없습니다.')) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      router.push('/admin/match');
    } catch {
      setSubmitError('삭제에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!id) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-error">잘못된 경로입니다.</p>
        <Link href="/admin/match" className="btn btn-ghost mt-2">매칭 목록으로</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">매칭 수정</h1>
      <p className="text-base-content/70 text-sm mb-6">
        날짜, 구장, 상대팀을 수정할 수 있습니다.
      </p>

      <div className="card bg-base-200 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base text-base-content">매칭 일시 · 구장</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">매칭 날짜</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
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
        </div>
      </div>

      <div className="card bg-base-200 shadow-sm mb-6">
        <div className="card-body">
          <h2 className="card-title text-base text-base-content/80">상대팀 (선택)</h2>
          <div className="form-control relative" ref={autocompleteRef}>
            <label className="label">
              <span className="label-text">팀명 검색</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="팀명 입력"
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
            {selectedTeam ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {submitError && (
        <p className="text-error text-sm mb-4">{submitError}</p>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          className="btn btn-error"
          onClick={handleDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? '삭제 중…' : '매칭 삭제'}
        </button>
        <Link href="/admin/match" className="btn btn-neutral">
          목록으로
        </Link>
      </div>
    </div>
  );
}
