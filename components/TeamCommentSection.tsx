'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatDateTimeKo } from '@/lib/format-date';

export type EvaluationItem = {
  id: string;
  match_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  evaluator_id: string;
  evaluator_name: string | null;
  evaluator_is_active: boolean | null;
  evaluator_deleted_at: string | null;
};

type Props = {
  evaluations: EvaluationItem[];
  teamId: string;
  /** DB에 있는 매칭 중 하나의 id. 없으면 새 코멘트 등록 불가 */
  firstMatchId: string | null;
};

export default function TeamCommentSection({ evaluations: initialEvaluations, teamId, firstMatchId }: Props) {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEvaluations(initialEvaluations);
  }, [initialEvaluations]);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setCurrentUserId(data?.user?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  const canCreate = Boolean(firstMatchId && currentUserId);
  const handleConfirm = async () => {
    setError(null);
    if (editingId) {
      setLoading(true);
      try {
        const res = await fetch(`/api/evaluations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: inputValue.trim() || null }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error ?? '수정에 실패했습니다.');
          return;
        }
        setEvaluations((prev) =>
          prev.map((e) =>
            e.id === editingId ? { ...e, comment: data.comment ?? e.comment } : e
          )
        );
        setEditingId(null);
        setInputValue('');
        router.refresh();
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!firstMatchId) {
      setError('새 코멘트를 남기려면 매칭 이력이 필요합니다.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: firstMatchId,
          comment: inputValue.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? '등록에 실패했습니다.');
        return;
      }
      setEvaluations((prev) => [{ ...data, evaluator_id: currentUserId!, evaluator_name: null, evaluator_is_active: true, evaluator_deleted_at: null } as EvaluationItem, ...prev]);
      setInputValue('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 코멘트를 삭제할까요?')) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? '삭제에 실패했습니다.');
        return;
      }
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setInputValue('');
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (e: EvaluationItem) => {
    setEditingId(e.id);
    setInputValue(e.comment ?? '');
    setError(null);
  };

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-base">코멘트</h2>

        {evaluations.length === 0 ? (
          <p className="text-sm text-base-content text-center">코멘트가 없습니다.</p>
        ) : (
          <ul className="space-y-3 list-none pl-0">
            {evaluations.map((e) => {
              const isDeleted = !e.evaluator_is_active || e.evaluator_deleted_at != null;
              const displayName = e.evaluator_name ?? '(알 수 없음)';
              const isOwn = currentUserId === e.evaluator_id;
              return (
                <li key={e.id} className="py-3 border-b border-base-300 last:border-0">
<div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isDeleted ? (
                      <span className="text-sm text-base-content">{displayName}</span>
                      ) : (
                        <Link href={`/profile/${e.evaluator_id}`} className="link link-hover text-sm font-medium">
                          {displayName}
                        </Link>
                      )}
                    <span className="text-xs text-base-content/60">
                      {/* {e.rating}점 · {formatDateTimeKo(e.created_at)} */}
                      {formatDateTimeKo(e.created_at)}
                    </span>
                    {isOwn && (
                      <span className="flex gap-1 ml-auto">
                        <button
                          type="button"
                          className="link btn btn-ghost btn-xs"
                          onClick={() => startEdit(e)}
                          disabled={loading}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="link btn btn-ghost btn-xs text-error"
                          onClick={() => handleDelete(e.id)}
                          disabled={loading}
                        >
                          삭제
                        </button>
                      </span>
                    )}
                  </div>
                  {e.comment && <p className="text-sm text-base-content">{e.comment}</p>}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 space-y-2">
          <textarea
            className="textarea textarea-bordered w-full resize-none"
            placeholder={editingId ? '수정할 내용' : '코멘트 입력'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={3}
            disabled={loading}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2 flex-wrap justify-end">
            {editingId && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEditingId(null);
                  setInputValue('');
                  setError(null);
                }}
                disabled={loading}
              >
                취소
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleConfirm}
              disabled={loading || (!editingId && !canCreate)}
            >
              확인
            </button>
          </div>
          {!currentUserId && (
            <p className="text-sm text-base-content/60">코멘트를 남기려면 로그인해 주세요.</p>
          )}
          {currentUserId && !firstMatchId && evaluations.length === 0 && (
            <p className="text-sm text-base-content/60">매칭 이력이 DB에 있을 때만 새 코멘트를 남길 수 있습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
