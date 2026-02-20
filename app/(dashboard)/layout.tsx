'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: 'home' },
  { label: 'Search', path: '/search', icon: 'search' },
  { label: 'Map', path: '/map', icon: 'map' },
  { label: 'Mypage', path: '/mypage', icon: 'user' },
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (pathname === item.path) return true;
    if (item.path === '/map' && pathname.startsWith('/team/')) return true;
    if (item.path !== '/home' && pathname.startsWith(item.path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      <main className="w-full px-4 py-6">
        {children}
      </main>
      <nav className="dock dock-md">
        {NAV_ITEMS.map((item) => (
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
  );
}
