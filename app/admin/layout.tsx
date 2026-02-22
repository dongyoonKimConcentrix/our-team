'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: 'home' },
  { label: 'Search', path: '/search', icon: 'search' },
  { label: 'Map', path: '/map', icon: 'map' },
  { label: 'Mypage', path: '/mypage', icon: 'user' },
] as const;

const ADMIN_MENU_ITEMS = [
  { label: '매칭 목록', path: '/admin/match', icon: 'list' },
  { label: '매칭 등록', path: '/admin/match/new', icon: 'calendarPlus' },
  { label: '팀원 계정 생성', path: '/admin/members/new', icon: 'userPlus' },
] as const;

const ICONS: Record<(typeof NAV_ITEMS)[number]['icon'], React.ReactNode> = {
  home: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt" aria-hidden>
      <polyline points="1 11 12 2 23 11" fill="none" stroke="currentColor" strokeMiterlimit={10} strokeWidth={2} />
      <path d="m5,13v7c0,1.105.895,2,2,2h10c1.105,0,2-.895,2-2v-7" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit={10} strokeWidth={2} />
      <line x1="12" y1="22" x2="12" y2="18" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit={10} strokeWidth={2} />
    </svg>
  ),
  search: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  map: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  user: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const ADMIN_ICONS: Record<(typeof ADMIN_MENU_ITEMS)[number]['icon'], React.ReactNode> = {
  list: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  calendarPlus: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="15" y1="16" x2="9" y2="16" />
    </svg>
  ),
  userPlus: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminHome = pathname === '/admin';

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path === '/map' && pathname.startsWith('/team/')) return true;
    if (path !== '/home' && path !== '/admin' && pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    (document.getElementById('drawer-menu-admin') as HTMLInputElement | null)?.click();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="drawer drawer-end">
      <input id="drawer-menu-admin" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-screen bg-base-100 flex flex-col">
        <header className="navbar fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[720px] z-50 bg-base-100 shadow-sm">
          <div className="navbar-start flex-1 min-w-0">
            {!isAdminHome && (
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-ghost btn-circle shrink-0"
                aria-label="뒤로 가기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          <div className="navbar-center shrink-0">
            <Link href="/admin" className="btn btn-ghost text-xl font-bold">
              FS Juntos
            </Link>
          </div>
          <div className="navbar-end flex-1 flex justify-end gap-1">
            <Link href="/search" className="btn btn-ghost btn-circle" aria-label="검색">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <label htmlFor="drawer-menu-admin" className="btn btn-ghost btn-circle drawer-button" aria-label="메뉴">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </label>
          </div>
        </header>
        <main className="container max-w-7xl mx-auto px-4 py-6 pt-20 pb-8 flex-1">
          {children}
        </main>
      </div>
      <div className="drawer-side z-[100]">
        <label htmlFor="drawer-menu-admin" aria-label="메뉴 닫기" className="drawer-overlay" />
        <div className="menu bg-base-200 min-h-full w-80 p-4 flex flex-col">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={isActive(item.path) ? 'active' : ''}
                  onClick={() => {
                    (document.getElementById('drawer-menu-admin') as HTMLInputElement | null)?.click();
                  }}
                >
                  <span className="h-5 w-5 shrink-0 [&_svg]:h-5 [&_svg]:w-5">
                    {ICONS[item.icon]}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-2 pt-2 border-t border-base-300">
            <li className="menu-title">
              <span>관리자</span>
            </li>
            {ADMIN_MENU_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={isActive(item.path) ? 'active' : ''}
                  onClick={() => {
                    (document.getElementById('drawer-menu-admin') as HTMLInputElement | null)?.click();
                  }}
                >
                  <span className="h-5 w-5 shrink-0 [&_svg]:h-5 [&_svg]:w-5">
                    {ADMIN_ICONS[item.icon]}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-2 mt-2 border-t border-base-300 flex-1" />
          <div className="pt-2 mt-2 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost btn-block justify-start gap-2 text-base-content/80"
              onClick={handleLogout}
            >
              <span className="h-5 w-5 shrink-0" aria-hidden>🚪</span>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
