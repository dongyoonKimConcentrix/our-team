'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';

type SearchTeam = {
  id: string;
  name: string;
  age_range: string | null;
  skill_level: string | null;
  contacts: Array<{ type?: string; value?: string }> | null;
  is_blacklisted: boolean;
};

const DEBOUNCE_MS = 300;

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [results, setResults] = useState<SearchTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (filterDate) params.set('date', filterDate.format('YYYY-MM-DD'));
      const res = await fetch(`/api/search/teams?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '검색 실패');
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filterDate]);

  useEffect(() => {
    if (!mounted) return;
    fetchResults();
  }, [mounted, debouncedQuery, filterDate, fetchResults]);

  const contactsText = (c: SearchTeam['contacts']) => {
    if (!Array.isArray(c) || !c.length) return '-';
    return c.map((x) => `${x.type ?? ''}: ${x.value ?? ''}`).join(', ');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <Container maxWidth="md">
        <Typography variant="h6" fontWeight={600} gutterBottom>
          통합 검색
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          팀명, 구장명, 연락처로 부분 일치 검색. 날짜를 선택하면 해당 날짜에 매칭한 팀만 표시됩니다.
        </Typography>

        <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="팀명, 구장명, 연락처 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.secondary', fontSize: 20 }}>🔍</Box>
                  </InputAdornment>
                ),
              }}
              sx={{ flex: '1 1 240px', maxWidth: 400 }}
            />
            {mounted && (
              <DatePicker
                label="매칭 날짜 필터"
                value={filterDate}
                onChange={(d) => setFilterDate(d)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 200 },
                  },
                }}
              />
            )}
          </Box>
        </Paper>

        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            검색 중...
          </Typography>
        )}

        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {results.map((team) => (
            <Box
              component="li"
              key={team.id}
              sx={{
                mb: 1,
                '&:last-child': { mb: 0 },
              }}
            >
              <Paper
                component={Link}
                href={`/team/${team.id}`}
                sx={{
                  display: 'block',
                  p: 2,
                  borderRadius: 2,
                  textDecoration: 'none',
                  borderLeft: '4px solid',
                  borderColor: team.is_blacklisted ? 'error.main' : 'transparent',
                  bgcolor: team.is_blacklisted ? 'error.light' : 'background.paper',
                  color: team.is_blacklisted ? 'error.dark' : 'text.primary',
                  '&:hover': {
                    bgcolor: team.is_blacklisted ? 'error.light' : 'action.hover',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {team.name}
                  </Typography>
                  {team.is_blacklisted && (
                    <Chip label="블랙리스트" color="error" size="small" sx={{ fontWeight: 600 }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  나이대 {team.age_range ?? '-'} · 실력 {team.skill_level ?? '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  연락처: {contactsText(team.contacts)}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {!loading && mounted && results.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {debouncedQuery || filterDate ? '검색 결과가 없습니다.' : '검색어를 입력하거나 날짜를 선택해보세요.'}
          </Typography>
        )}
      </Container>
    </LocalizationProvider>
  );
}
