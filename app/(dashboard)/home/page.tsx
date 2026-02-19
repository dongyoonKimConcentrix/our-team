'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 2 }}>
        <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
          홈
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          팀 매칭 관리에 오신 것을 환영합니다.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Button
              component={Link}
              href="/map"
              variant="outlined"
              fullWidth
              startIcon={<MapIcon />}
              sx={{ py: 1.5, justifyContent: 'flex-start' }}
            >
              지도에서 구장 보기
            </Button>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              component={Link}
              href="/search"
              variant="outlined"
              fullWidth
              startIcon={<ListIcon />}
              sx={{ py: 1.5, justifyContent: 'flex-start' }}
            >
              팀 검색
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
