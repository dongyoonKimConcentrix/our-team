'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const FADEOUT_MS = 300;
const MIN_SHOW_MS = 400;
const ROUTE_CHANGE_SHOW_MS = 400;

export default function PageLoadOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const isFirstMount = useRef(true);

  /** 초기 로드: document ready 후 최소 시간 보여준 뒤 fadeout */
  useEffect(() => {
    const start = Date.now();
    const runFade = () => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, MIN_SHOW_MS - elapsed);
      setTimeout(() => {
        setFading(true);
        setTimeout(() => setVisible(false), FADEOUT_MS);
      }, delay);
    };
    if (typeof document === 'undefined') return;
    if (document.readyState === 'complete') {
      runFade();
    } else {
      window.addEventListener('load', runFade);
      return () => window.removeEventListener('load', runFade);
    }
  }, []);

  /** 라우트 변경 시: 오버레이 표시 → 새 페이지 로드 대기 → fadeout */
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setVisible(true);
    setFading(false);
    const t = setTimeout(() => {
      setFading(true);
      const t2 = setTimeout(() => setVisible(false), FADEOUT_MS);
      return () => clearTimeout(t2);
    }, ROUTE_CHANGE_SHOW_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ease-out"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        width: '100%',
        height: '100%',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
      aria-hidden="true"
    >
      <span className="loading loading-spinner loading-xl text-primary" />
    </div>
  );
}
