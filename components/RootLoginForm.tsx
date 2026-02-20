'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = { redirectTo?: string };

export default function RootLoginForm({ redirectTo = '/home' }: Props) {
  const router = useRouter();
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
      const path = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      router.push(path);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4" onSubmit={handleSubmit}>
      <fieldset className="fieldset">
        <label className="label">아이디</label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
          required
        />
        <p className="validator-hint hidden">Required</p>
      </fieldset>
      <label className="fieldset">
        <span className="label">비밀번호</span>
        <input
          type="password"
          className="input input-bordered w-full"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <span className="validator-hint hidden">Required</span>
      </label>
      {error && <p className="text-error text-sm mt-1">{error}</p>}
      <button className="btn btn-neutral mt-4 w-full" type="submit" disabled={loading}>
        {loading ? '로그인 중…' : '로그인'}
      </button>
    </form>
  );
}
