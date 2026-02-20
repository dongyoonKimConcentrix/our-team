'use client';

import { useState } from 'react';

export default function CreateMemberPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password) {
      setMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성 실패');
      setMessage('계정이 생성되었습니다.');
      setId('');
      setPassword('');
      setName('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">팀원 계정 생성</h1>
      <p className="text-base-content/70 text-sm mb-6">
        로그인 시 아이디와 비밀번호를 사용합니다.
      </p>

      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">아이디</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                placeholder="로그인에 사용할 아이디"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">비밀번호</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">이름</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="표시 이름 (선택)"
              />
            </div>
            {message && (
              <p className={`text-sm ${message.startsWith('계정') ? 'text-success' : 'text-error'}`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '생성 중…' : '팀원 계정 생성'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
