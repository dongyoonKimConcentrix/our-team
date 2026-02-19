import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography component="h1" variant="h4" fontWeight={700}>
          팀 매칭 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button component={Link} href="/login" variant="contained">
            로그인
          </Button>
          <Button component={Link} href="/admin/map" variant="outlined">
            지도 보기
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
