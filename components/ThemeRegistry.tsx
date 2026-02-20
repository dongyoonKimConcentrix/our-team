'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';

/**
 * MUI ThemeProvider는 admin 매칭/계정 생성 등에서 MUI 컴포넌트를 쓰는 경우에만 필요.
 * 전역 UI는 DaisyUI(Tailwind) 사용.
 */
export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = React.useMemo(() => createAppTheme('light'), []);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: false }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
