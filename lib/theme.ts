'use client';

import { createTheme, alpha, PaletteMode, Theme } from '@mui/material/styles';

// 브랜드 컬러 (Primary, Secondary) — 팀 고유 색상
const BRAND = {
  primary: {
    main: '#2563eb',   // 진한 블루
    light: '#60a5fa',
    dark: '#1d4ed8',
  },
  secondary: {
    main: '#0ea5e9',   // 스카이
    light: '#38bdf8',
    dark: '#0284c7',
  },
} as const;

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: BRAND.primary,
    secondary: BRAND.secondary,
    ...(mode === 'dark' && {
      background: {
        default: '#0f172a',
        paper: '#1e293b',
      },
    }),
  },
  typography: {
    fontFamily: 'var(--font-noto-sans-kr), "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, 0.5),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
        }),
      },
      defaultProps: {
        variant: 'outlined' as const,
        size: 'medium' as const,
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  }
});

export const createAppTheme = (mode: PaletteMode) =>
  createTheme(getDesignTokens(mode));

export type AppTheme = ReturnType<typeof createAppTheme>;
