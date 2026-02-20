'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function MypagePage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">마이페이지</h1>
      <p className="text-base-content/70 text-sm mb-6">
        설정 및 계정
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin"
          className="btn btn-outline btn-block justify-start gap-2"
        >
          <span>⚙️</span>
          관리자 (매칭 등록 · 계정 생성)
        </Link>
        <button
          type="button"
          className="btn btn-outline btn-block justify-start gap-2"
          onClick={handleLogout}
        >
          <span>🚪</span>
          로그아웃
        </button>
      </div>
    </div>
  );
}
