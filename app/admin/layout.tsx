'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MapIcon from '@mui/icons-material/Map';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useThemeMode } from '@/components/ThemeRegistry';

const MENU_ITEMS = [
  { label: '지도 보기', path: '/map', icon: MapIcon },
  { label: '매칭 등록', path: '/admin/match/new', icon: EventNoteIcon },
  { label: '팀원 계정 생성', path: '/admin/members/new', icon: PersonAddIcon },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { mode, setMode } = useThemeMode();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.5,
          mb: 2,
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              component={Link}
              href="/admin"
              variant="h6"
              fontWeight={700}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
              관리자
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              {MENU_ITEMS.map(({ label, path, icon: Icon }) => (
                <Button
                  key={path}
                  component={Link}
                  href={path}
                  size="medium"
                  startIcon={<Icon sx={{ fontSize: 20 }} />}
                  variant={pathname === path ? 'contained' : 'text'}
                  sx={{
                    fontFamily: 'inherit',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {label}
                </Button>
              ))}
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => v && setMode(v)}
                size="small"
                sx={{ ml: 0.5 }}
                aria-label="테마"
              >
                <ToggleButton value="light" aria-label="라이트">
                  <LightModeIcon sx={{ fontSize: 20 }} />
                </ToggleButton>
                <ToggleButton value="dark" aria-label="다크">
                  <DarkModeIcon sx={{ fontSize: 20 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="xl" component="main" sx={{ pb: 4 }}>
        <Box sx={{ py: 2 }}>{children}</Box>
      </Container>
    </Box>
  );
}
