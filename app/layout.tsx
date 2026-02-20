import type { Metadata } from 'next';
import ThemeRegistry from '@/components/ThemeRegistry';
import PageLoadOverlay from '@/components/PageLoadOverlay';
import './globals.css';

export const metadata: Metadata = {
  title: 'Our Team',
  description: 'Next.js + Supabase 매칭 관리 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="light" suppressHydrationWarning>
      <body id="__next" className="min-h-screen bg-base-300 text-base-content" suppressHydrationWarning>
        <div className="min-h-screen w-full max-w-[720px] mx-auto bg-base-100 shadow-xl sm:min-h-[100dvh] sm:rounded-none relative">
          <ThemeRegistry>{children}</ThemeRegistry>
          <PageLoadOverlay />
        </div>
      </body>
    </html>
  );
}
