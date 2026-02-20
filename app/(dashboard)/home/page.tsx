'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">홈</h1>
      <p className="text-base-content/70 text-sm mb-6">
        FS Juntos에 오신 것을 환영합니다.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/map" className="btn btn-outline btn-block justify-start gap-2">
          <span>🗺️</span>
          지도에서 구장 보기
        </Link>
        <Link href="/search" className="btn btn-outline btn-block justify-start gap-2">
          <span>📋</span>
          팀 검색
        </Link>
      </div>
    </div>
  );
}
