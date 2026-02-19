import Link from 'next/link';
import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getTeamMannerScoresLast5,
  getTeamMatchHistory,
  getTeamEvaluationsWithEvaluator,
} from '@/lib/data/team-detail';
import MannerScoreChart from '@/components/MannerScoreChart';
import { getWeatherEmoji } from '@/lib/weather-icons';

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

  const [mannerScores, matchHistory, evaluations] = await Promise.all([
    getTeamMannerScoresLast5(supabase, id),
    getTeamMatchHistory(supabase, id),
    getTeamEvaluationsWithEvaluator(supabase, id),
  ]);

  const contacts = Array.isArray(team.contacts) ? team.contacts : [];
  const contactItems = contacts as Array<{ type?: string; value?: string }>;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Button component={Link} href="/map" size="small" sx={{ mb: 2 }}>
          ← 지도로 돌아가기
        </Button>

        {/* 상단: 팀 기본 정보, 연락처, 블랙리스트 */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Typography component="h1" variant="h5" fontWeight={700}>
              {team.name}
            </Typography>
            {team.is_blacklisted && (
              <Chip
                label="블랙리스트"
                color="error"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Grid container spacing={2}>
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
            {contactItems.length > 0 && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  연락처
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {contactItems.map((c, i) => (
                    <li key={i}>
                      <Typography component="span" variant="body2">
                        {c.type ? `${c.type}: ` : ''}{c.value ?? '-'}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* 중간: 최근 5경기 매너 점수 선 그래프 */}
        <Box sx={{ mb: 3 }}>
          <MannerScoreChart data={mannerScores} />
        </Box>

        {/* 하단: 매칭 이력 + 코멘트 리스트 */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                매칭 이력
              </Typography>
              {matchHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  매칭 이력이 없습니다.
                </Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2, listStyle: 'none' }}>
                  {matchHistory.map((m) => (
                    <Box
                      component="li"
                      key={m.id}
                      sx={{
                        py: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:last-of-type': { borderBottom: 0 },
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(m.match_date + 'Z').toLocaleDateString('ko-KR')} · {m.stadium_name}
                      </Typography>
                      {m.weather && typeof m.weather === 'object' && (
                        <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                          {[m.weather.temp_c != null && `${m.weather.temp_c}°C`, m.weather.humidity != null && `습도 ${m.weather.humidity}%`, m.weather.clouds && `${getWeatherEmoji(m.weather.clouds)} ${m.weather.clouds}`].filter(Boolean).join(' · ')}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                코멘트
              </Typography>
              {evaluations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  코멘트가 없습니다.
                </Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                  {evaluations.map((e) => {
                    const isDeleted = !e.evaluator_is_active || e.evaluator_deleted_at != null;
                    const displayName = e.evaluator_name ?? '(알 수 없음)';
                    return (
                      <Box
                        component="li"
                        key={e.id}
                        sx={{
                          py: 1.5,
                          borderBottom: 1,
                          borderColor: 'divider',
                          '&:last-of-type': { borderBottom: 0 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          {isDeleted ? (
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ cursor: 'default' }}>
                              {displayName}
                            </Typography>
                          ) : (
                            <Button
                              component={Link}
                              href={`/profile/${e.evaluator_id}`}
                              size="small"
                              sx={{ minWidth: 0, p: 0, textTransform: 'none', fontWeight: 500 }}
                            >
                              {displayName}
                            </Button>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {e.rating}점 · {new Date(e.created_at).toLocaleDateString('ko-KR')}
                          </Typography>
                        </Box>
                        {e.comment && (
                          <Typography variant="body2" color="text.secondary">
                            {e.comment}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
