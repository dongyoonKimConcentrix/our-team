'use client';

import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';

const StadiumMap = dynamic(() => import('@/components/StadiumMap'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: '70vh',
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
        borderRadius: 2,
      }}
    >
      <Typography color="text.secondary">지도 로딩 중...</Typography>
    </Box>
  ),
});

export default function MapPage() {
  return (
    <Container maxWidth="xl">
      <Grid container spacing={2}>
        <Grid size={12}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            구장 지도
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            마커를 클릭하면 해당 구장에서 매칭한 팀 목록을 볼 수 있습니다. 팀 이름을 클릭하면 상세 페이지로 이동합니다.
          </Typography>
        </Grid>
        <Grid size={12}>
          <StadiumMap />
        </Grid>
      </Grid>
    </Container>
  );
}
