'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = id.includes('@') ? id : `${id.trim()}@team.local`;
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      const path = next.startsWith('/') ? next : `/${next}`;
      router.push(path);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Grid container justifyContent="center">
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
                로그인
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                팀 매칭 관리 서비스에 로그인하세요.
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="아이디"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="비밀번호"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </Grid>
                  {error && (
                  <Grid size={12}>
                    <Typography variant="body2" color="error">{error}</Typography>
                  </Grid>
                )}
                  <Grid size={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{ py: 1.5 }}
                      disabled={loading}
                    >
                      {loading ? '로그인 중…' : '로그인'}
                    </Button>
                  </Grid>
                  <Grid size={12}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button component={Link} href="/" size="small" color="inherit">
                        홈으로
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">로딩 중...</Typography>
      </Box>
    }>
      <LoginForm />
    </Suspense>
  );
}
