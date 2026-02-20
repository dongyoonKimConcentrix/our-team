'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU_ITEMS = [
  { label: '지도 보기', path: '/map', icon: '🗺️' },
  { label: '매칭 등록', path: '/admin/match/new', icon: '📅' },
  { label: '팀원 계정 생성', path: '/admin/members/new', icon: '👤' },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const t = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <header className="border-b border-base-300 py-3 px-4 bg-base-100 shadow-sm">
        <div className="container max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="font-bold text-lg flex items-center gap-2 no-underline text-base-content"
          >
            <span>⚙️</span>
            관리자
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {MENU_ITEMS.map(({ label, path, icon }) => (
              <Link
                key={path}
                href={path}
                className={`btn btn-sm ${pathname === path ? 'btn-primary' : 'btn-ghost'}`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? '다크 모드' : '라이트 모드'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>
      <main className="container max-w-7xl mx-auto px-4 py-6 pb-8">
        {children}
      </main>
    </div>
  );
}
