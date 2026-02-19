'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';

type TeamOption = {
  id: string;
  name: string;
  age_range: string | null;
  skill_level: string | null;
  contacts: Array<{ type?: string; value?: string }>;
};

type StadiumOption = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
};

export default function NewMatchPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [stadiums, setStadiums] = useState<StadiumOption[]>([]);
  const [matchDate, setMatchDate] = useState<Dayjs | null>(null);
  const [stadiumId, setStadiumId] = useState('');
  const [tempC, setTempC] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [clouds, setClouds] = useState<string>('');
  const [ourTeamAttendance, setOurTeamAttendance] = useState<number>(0);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchTeams = useCallback(async (q: string) => {
    const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (Array.isArray(data)) setTeamOptions(data as TeamOption[]);
  }, []);

  useEffect(() => {
    if (teamInput.length >= 0) searchTeams(teamInput);
  }, [teamInput, searchTeams]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stadiums')
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setStadiums(data); });
    return () => { cancelled = true; };
  }, []);

  const selectedStadium = stadiums.find((s) => s.id === stadiumId);

  const fetchWeather = useCallback(async () => {
    if (!selectedStadium || !matchDate) return;
    setWeatherLoading(true);
    try {
      const dateStr = matchDate.format('YYYY-MM-DD');
      const res = await fetch(
        `/api/weather?lat=${selectedStadium.lat}&lng=${selectedStadium.lng}&date=${dateStr}`
      );
      const data = await res.json();
      if (data.temp_c != null) setTempC(String(data.temp_c));
      if (data.humidity != null) setHumidity(String(data.humidity));
      if (data.clouds) setClouds(data.clouds);
      setWeatherError(data.error ?? null);
    } catch {
      setWeatherError('날씨 조회 실패');
    } finally {
      setWeatherLoading(false);
    }
  }, [selectedStadium, matchDate]);

  useEffect(() => {
    if (matchDate && stadiumId && selectedStadium) fetchWeather();
  }, [matchDate, stadiumId, selectedStadium?.id]);

  const handleSubmitMatch = async () => {
    if (!matchDate || !stadiumId) {
      setSubmitError('날짜와 구장을 선택해주세요.');
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_date: matchDate.format('YYYY-MM-DD'),
          stadium_id: stadiumId,
          our_team_attendance: ourTeamAttendance,
          weather: {
            temp_c: tempC ? parseFloat(tempC) : undefined,
            humidity: humidity ? parseFloat(humidity) : undefined,
            clouds: clouds || undefined,
          },
          team_id: selectedTeam?.id ?? undefined,
          owner_team_id: selectedTeam?.id ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록 실패');
      router.push('/map');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '등록 실패');
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <Container maxWidth="md">
        <Typography variant="h6" fontWeight={600} gutterBottom>
          매칭 등록
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            팀 선택 (기존 팀 정보 자동완성)
          </Typography>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Autocomplete
                options={teamOptions}
                getOptionLabel={(o) => o.name}
                value={selectedTeam}
                onChange={(_, v) => setSelectedTeam(v)}
                inputValue={teamInput}
                onInputChange={(_, v) => setTeamInput(v)}
                renderInput={(params) => (
                  <TextField {...params} label="팀명 검색" placeholder="팀명 입력" />
                )}
              />
            </Grid>
            {selectedTeam && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="나이대"
                    value={selectedTeam.age_range ?? ''}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="실력"
                    value={selectedTeam.skill_level ?? ''}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="연락처"
                    value={
                      Array.isArray(selectedTeam.contacts) && selectedTeam.contacts.length
                        ? selectedTeam.contacts.map((c) => `${c.type ?? ''}: ${c.value ?? ''}`).join(', ')
                        : '-'
                    }
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            매칭 일시 · 구장 (날짜·구장 선택 시 기상청 단기예보로 날씨 자동 채움)
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              {mounted ? (
                <DatePicker
                  label="매칭 날짜"
                  value={matchDate}
                  onChange={(d) => setMatchDate(d)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              ) : (
                <TextField fullWidth size="small" label="매칭 날짜" placeholder="로딩..." disabled />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="구장"
                value={stadiumId}
                onChange={(e) => setStadiumId(e.target.value)}
              >
                <MenuItem value="">선택</MenuItem>
                {stadiums.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="기온"
                value={tempC}
                onChange={(e) => setTempC(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="습도"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="하늘 상태"
                value={clouds}
                onChange={(e) => setClouds(e.target.value)}
                placeholder="맑음 / 구름많음 / 흐림"
              />
            </Grid>
            {weatherLoading && (
              <Grid size={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="caption">날씨 조회 중...</Typography>
                </Box>
              </Grid>
            )}
            {weatherError && !weatherLoading && (
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">{weatherError}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="우리 팀 참석 인원"
                value={ourTeamAttendance}
                onChange={(e) => setOurTeamAttendance(parseInt(e.target.value, 10) || 0)}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
          {submitError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {submitError}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSubmitMatch}
            disabled={submitLoading}
            sx={{ mt: 2 }}
          >
            {submitLoading ? '등록 중…' : '매칭 등록'}
          </Button>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}
