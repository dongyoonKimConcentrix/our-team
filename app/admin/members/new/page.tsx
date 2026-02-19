'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function CreateMemberPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password) {
      setMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id.trim(),
          password,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성 실패');
      setMessage('계정이 생성되었습니다.');
      setId('');
      setPassword('');
      setName('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h6" fontWeight={600} gutterBottom>
        팀원 계정 생성
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          로그인 시 아이디와 비밀번호를 사용합니다.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="아이디"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                placeholder="로그인에 사용할 아이디"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="표시 이름 (선택)"
              />
            </Grid>
            {message && (
              <Grid size={12}>
                <Typography
                  variant="body2"
                  color={message.startsWith('계정') ? 'success.main' : 'error.main'}
                >
                  {message}
                </Typography>
              </Grid>
            )}
            <Grid size={12}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? '생성 중…' : '팀원 계정 생성'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
