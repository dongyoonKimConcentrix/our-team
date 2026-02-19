'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MannerScorePoint } from '@/lib/data/team-detail';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

type Props = {
  data: MannerScorePoint[];
};

export default function MannerScoreChart({ data }: Props) {
  if (!data.length) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          최근 경기 매너 점수 데이터가 없습니다.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        최근 5경기 매너 점수 추이
      </Typography>
      <Box sx={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="divider" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'divider' }}
            />
            <YAxis
              domain={[1, 5]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8 }}
              formatter={(value: number) => [`${value}점`, '매너 점수']}
              labelFormatter={(label) => `경기: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={() => '매너 점수'}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="매너 점수"
              stroke="var(--mui-palette-primary-main)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
