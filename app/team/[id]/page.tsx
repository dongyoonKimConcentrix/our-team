import Link from 'next/link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Params = { id: string };

export default async function TeamDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data: team, error } = await supabase
    .from('teams')
    .select('id, name, age_range, skill_level, is_blacklisted, contacts, created_at')
    .eq('id', id)
    .single();

  if (error || !team) notFound();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Button component={Link} href="/admin/map" size="small" sx={{ mb: 2 }}>
          ← 지도로 돌아가기
        </Button>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography component="h1" variant="h5" fontWeight={700} gutterBottom>
            {team.name}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                나이대
              </Typography>
              <Typography variant="body1">{team.age_range ?? '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                실력
              </Typography>
              <Typography variant="body1">{team.skill_level ?? '-'}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                블랙리스트
              </Typography>
              <Typography variant="body1">
                {team.is_blacklisted ? '예' : '아니오'}
              </Typography>
            </Grid>
            {Array.isArray(team.contacts) && team.contacts.length > 0 && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary">
                  연락처
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {team.contacts.map((c: { type?: string; value?: string }, i: number) => (
                    <li key={i}>
                      {c.type}: {c.value}
                    </li>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}
