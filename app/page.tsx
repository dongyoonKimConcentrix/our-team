import SoccerEmptyLottie from '@/components/SoccerEmptyLottie';
import RootLoginForm from '@/components/RootLoginForm';

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 pt-[100px]">
      <h1 className="text-4xl font-bold text-center">FS Juntos</h1>
      <SoccerEmptyLottie />
      <RootLoginForm />
    </div>
  );
}
