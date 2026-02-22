'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: 'home' },
  { label: 'Search', path: '/search', icon: 'search' },
  { label: 'Map', path: '/map', icon: 'map' },
  { label: 'Member', path: '/member', icon: 'member' },
  { label: 'Mypage', path: '/mypage', icon: 'user' },
] as const;

/** dock(하단 네비)에는 Member 제외 */
const DOCK_ITEMS = NAV_ITEMS.filter((item) => item.path !== '/member');

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
  member: (
    <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/home';

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (pathname === item.path) return true;
    if (item.path === '/map' && pathname.startsWith('/team/')) return true;
    if (item.path !== '/home' && pathname.startsWith(item.path)) return true;
    return false;
  };

  const handleLogout = async () => {
    (document.getElementById('drawer-menu-dashboard') as HTMLInputElement | null)?.click();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="drawer drawer-end">
      <input id="drawer-menu-dashboard" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content min-h-screen bg-base-100 pb-20 flex flex-col">
        <header className="navbar fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[720px] z-50 bg-base-100 shadow-sm">
          <div className="navbar-start flex-1 min-w-0">
            {!isHome && (
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
            <Link href="/home" className="btn btn-ghost text-xl font-bold">
              FS Juntos
            </Link>
          </div>
          <div className="navbar-end flex-1 flex justify-end gap-1">
            <Link href="/search" className="btn btn-ghost btn-circle" aria-label="검색">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <label htmlFor="drawer-menu-dashboard" className="btn btn-ghost btn-circle drawer-button" aria-label="메뉴">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </label>
          </div>
        </header>
        <main className="w-full px-4 py-6 pt-20 flex-1">
          {children}
        </main>
        <nav className="dock dock-md">
          {DOCK_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={isActive(item) ? 'dock-active text-primary' : ''}
            >
              {ICONS[item.icon]}
              <span className="dock-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="drawer-side z-[100]">
        <label htmlFor="drawer-menu-dashboard" aria-label="메뉴 닫기" className="drawer-overlay" />
        <div className="menu bg-base-200 min-h-full w-80 p-4 flex flex-col">
          <ul className="flex-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={isActive(item) ? 'active' : ''}
                  onClick={() => {
                    (document.getElementById('drawer-menu-dashboard') as HTMLInputElement | null)?.click();
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
          <div className="pt-2 mt-2 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost btn-block justify-start gap-2 text-base-content/80"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
