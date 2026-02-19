'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useThemeMode } from '@/components/ThemeRegistry';

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
        }}
      >
        <Container maxWidth="xl">
          <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
            <Grid size="auto">
              <Typography component={Link} href="/admin" variant="h6" fontWeight={700} sx={{ color: 'inherit' }}>
                매칭 관리
              </Typography>
            </Grid>
            <Grid size="auto">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button component={Link} href="/admin/map" variant={pathname === '/admin/map' ? 'contained' : 'text'} size="small">
                  지도
                </Button>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, v) => v && setMode(v)}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <ToggleButton value="light">라이트</ToggleButton>
                  <ToggleButton value="dark">다크</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Container maxWidth="xl" component="main" sx={{ pb: 4 }}>
        <Box sx={{ py: 2 }}>{children}</Box>
      </Container>
    </Box>
  );
}
