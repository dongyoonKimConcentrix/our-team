'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { createAppTheme } from '@/lib/theme';

export default function ThemeRegistry({
  children,
  defaultMode = 'light',
}: {
  children: React.ReactNode;
  defaultMode?: 'light' | 'dark';
}) {
  const [mode, setMode] = React.useState<'light' | 'dark'>(defaultMode);
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: false }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          }}
        >
          <ThemeModeContext.Provider value={{ mode, setMode }}>
            {children}
          </ThemeModeContext.Provider>
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

const ThemeModeContext = React.createContext<{
  mode: 'light' | 'dark';
  setMode: (m: 'light' | 'dark') => void;
}>({ mode: 'light', setMode: () => {} });

export const useThemeMode = () => React.useContext(ThemeModeContext);
