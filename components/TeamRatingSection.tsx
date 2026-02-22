'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export type TeamRatingsSummary = {
  average: number;
  count: number;
};

type Props = {
  teamId: string;
  summary: TeamRatingsSummary;
};

export default function TeamRatingSection({ teamId, summary: initialSummary }: Props) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) {
          setIsLoggedIn(true);
          return fetch(`/api/teams/${teamId}/rating`).then((r) => r.json());
        }
        return { rating: null };
      })
      .then((data) => setMyRating(data?.rating ?? null))
      .catch(() => setMyRating(null));
  }, [teamId]);

  const handleRate = async (value: number) => {
    if (!isLoggedIn) return;
    setLoading(true);
    const prevRating = myRating;
    try {
      const res = await fetch(`/api/teams/${teamId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return;
      }
      setMyRating(data.rating ?? value);
      // 총 별점 내역 즉시 반영 (낙관적 업데이트)
      setSummary((prev) => {
        const prevCount = prev.count;
        const prevSum = prev.average * prevCount;
        if (prevRating == null) {
          const newCount = prevCount + 1;
          const newSum = prevSum + value;
          return { average: newSum / newCount, count: newCount };
        }
        const newSum = prevSum - prevRating + value;
        return { average: newSum / prevCount, count: prevCount };
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const avgStar = Math.round(summary.average);
  const displayStar = avgStar >= 1 && avgStar <= 5 ? avgStar : 0;

  return (
    <div className="card bg-base-200 shadow-sm mb-6">
      <div className="card-body">
        <h2 className="card-title text-base mb-2">별점 (5점 만점)</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-base-content/70 mb-1">총 별점 내역</p>
            {summary.count === 0 ? (
              <p className="text-sm text-base-content/60">아직 별점이 없습니다.</p>
            ) : (
              <>
                <div className="rating" aria-label="평균 별점">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <input
                      key={n}
                      type="radio"
                      name="rating-total"
                      className="mask mask-star-2 bg-orange-400"
                      aria-label={`${n}점`}
                      checked={n === displayStar}
                      readOnly
                    />
                  ))}
                </div>
                <p className="text-sm text-base-content/70 mt-1">
                  평균 {summary.average.toFixed(1)}점 ({summary.count}명)
                </p>
              </>
            )}
          </div>

          {isLoggedIn && (
            <div>
              <p className="text-sm text-base-content/70 mb-1">내 별점</p>
              <div className="rating gap-0" role="group" aria-label="내 별점 선택">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`mask mask-star-2 w-6 h-6 transition-colors ${
                      (myRating ?? 0) >= n ? 'bg-orange-400' : 'bg-orange-400/30'
                    } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
                    aria-label={`${n}점`}
                    onClick={() => handleRate(n)}
                  />
                ))}
              </div>
              {myRating != null && (
                <p className="text-sm text-base-content/60 mt-1">현재 {myRating}점 (클릭 시 갱신)</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
