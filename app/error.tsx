'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="max-w-sm mx-auto py-12 text-center px-4">
      <h2 className="text-lg font-semibold text-error mb-2">오류가 발생했습니다</h2>
      <p className="text-sm text-base-content/70 mb-4">
        {error.message || '알 수 없는 오류'}
      </p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
