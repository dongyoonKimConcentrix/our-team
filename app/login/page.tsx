'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = id.includes('@') ? id : `${id.trim()}@team.local`;
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      const path = next.startsWith('/') ? next : `/${next}`;
      router.push(path);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100 py-8 px-4">
      <div className="card w-full max-w-md bg-base-200 shadow-xl border border-base-300">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <fieldset className="fieldset w-full border-0 gap-4 p-0">
              <legend className="fieldset-legend text-2xl font-bold mb-1">
                로그인
              </legend>
              <p className="label text-base-content/70 text-sm mb-4">
                Our Team 서비스에 로그인하세요.
              </p>

              <label
                className={`input input-bordered w-full flex items-center gap-2 ${error ? 'input-error' : ''}`}
                htmlFor="login-id"
              >
                <svg
                  className="h-[1em] shrink-0 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login-id"
                  type="text"
                  className="grow bg-transparent border-none outline-none min-w-0"
                  placeholder="아이디"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label
                className={`input input-bordered w-full flex items-center gap-2 ${error ? 'input-error' : ''}`}
                htmlFor="login-pw"
              >
                <svg
                  className="h-[1em] shrink-0 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
                <input
                  id="login-pw"
                  type="password"
                  className="grow bg-transparent border-none outline-none min-w-0"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error && <p className="validator-hint">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    로그인 중…
                  </>
                ) : (
                  '로그인'
                )}
              </button>

              <div className="text-center pt-2">
                <Link href="/" className="link link-hover text-sm">
                  홈으로
                </Link>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
