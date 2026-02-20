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

type Props = {
  data: MannerScorePoint[];
};

export default function MannerScoreChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <p className="text-sm text-base-content/70 text-center py-6">
            최근 경기 매너 점수 데이터가 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body">
        <p className="text-sm text-base-content/70 mb-2">최근 5경기 매너 점수 추이</p>
        <div className="w-full h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
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
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={() => '매너 점수'} />
              <Line
                type="monotone"
                dataKey="score"
                name="매너 점수"
                stroke="#570df8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
