'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SoccerEmptyLottie from '@/components/SoccerEmptyLottie';
import RootLoginForm from '@/components/RootLoginForm';

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 pt-[100px]">
      <h1 className="text-4xl font-bold text-center">FS Juntos</h1>
      <SoccerEmptyLottie />
      <RootLoginForm redirectTo={next} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 pt-[100px]">
          <h1 className="text-4xl font-bold text-center">FS Juntos</h1>
          <span className="loading loading-spinner loading-xl text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
