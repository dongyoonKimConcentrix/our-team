import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold text-center">FS Juntos</h1>
      <div className="flex gap-3">
        <Link href="/login" className="btn btn-primary">
          로그인
        </Link>
        <Link href="/map" className="btn btn-outline">
          지도 보기
        </Link>
      </div>
    </div>
  );
}
