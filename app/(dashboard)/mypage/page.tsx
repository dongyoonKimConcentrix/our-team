'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { createClient } from '@/lib/supabase/client';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';

export default function MypagePage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 2 }}>
        <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
          마이페이지
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          설정 및 계정
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Button
              component={Link}
              href="/admin"
              variant="outlined"
              fullWidth
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ py: 1.5, justifyContent: 'flex-start' }}
            >
              관리자 (매칭 등록 · 계정 생성)
            </Button>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ py: 1.5, justifyContent: 'flex-start' }}
              color="inherit"
            >
              로그아웃
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
