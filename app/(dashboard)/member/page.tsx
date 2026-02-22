'use client';

import { useState, useCallback } from 'react';

const TEAM_MEMBERS: { name: string; phone: string }[] = [
  { name: '권흥주', phone: '01090872439' },
  { name: '김동윤', phone: '01082420191' },
  { name: '김인수', phone: '01033306701' },
  { name: '김재규', phone: '01067995695' },
  { name: '김재홍', phone: '01030024183' },
  { name: '김지성', phone: '01054577682' },
  { name: '김지훈', phone: '01073314104' },
  { name: '남윤제', phone: '01029083585' },
  { name: '신필규', phone: '01082095391' },
  { name: '이민석', phone: '01031377462' },
  { name: '이철훈', phone: '01026857396' },
];

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('010')) {
    return `010-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export default function MemberPage() {
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopy = useCallback(async (phone: string) => {
    const formatted = formatPhoneDisplay(phone);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch {
      // fallback for older browsers
      try {
        await navigator.clipboard.writeText(phone.replace(/\D/g, ''));
        setCopiedPhone(phone);
        setTimeout(() => setCopiedPhone(null), 2000);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">팀 멤버</h1>
      <p className="text-base-content/70 text-sm mb-6">
        팀원 이름과 전화번호입니다. 전화 걸기 또는 복사할 수 있습니다.
      </p>

      <ul className="space-y-2">
        {TEAM_MEMBERS.map((m) => {
          const formatted = formatPhoneDisplay(m.phone);
          const telHref = `tel:${formatted.replace(/-/g, '')}`;
          const isCopied = copiedPhone === m.phone;

          return (
            <li
              key={m.phone}
              className="card bg-base-200 shadow-sm"
            >
              <div className="card-body py-3 px-4 flex flex-row items-center justify-between gap-3">
                <span className="font-medium shrink-0">{m.name}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <a
                    href={telHref}
                    className="link link-hover text-sm truncate"
                  >
                    {formatted}
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs shrink-0"
                    onClick={() => handleCopy(m.phone)}
                    aria-label="전화번호 복사"
                  >
                    {isCopied ? '복사됨' : 'Copy'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
