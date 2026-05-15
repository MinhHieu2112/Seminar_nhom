'use client';

import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { TimeDistribution } from '@/hooks/useAnalyticsDashboard';

// Mock subject-based stacked data – will be replaced once backend returns it
function generateStackedData(dist: TimeDistribution) {
  const total = dist.morning + dist.afternoon + dist.evening || 1;
  const scale = (v: number) => Math.round((v / total) * 100);
  return [
    { day: 'Sáng', Toán: scale(dist.morning * 0.4), Văn: scale(dist.morning * 0.3), Lý: scale(dist.morning * 0.3) },
    { day: 'Trưa', Toán: scale(dist.afternoon * 0.35), Văn: scale(dist.afternoon * 0.4), Lý: scale(dist.afternoon * 0.25) },
    { day: 'Tối',  Toán: scale(dist.evening * 0.3), Văn: scale(dist.evening * 0.2), Lý: scale(dist.evening * 0.5) },
  ];
}

const SUBJECT_COLORS = {
  Toán: '#6366f1',
  Văn:  '#f59e0b',
  Lý:   '#10b981',
};

interface Props { timeDistribution: TimeDistribution; }

export const TimeStackedBarChart = memo(function TimeStackedBarChart({ timeDistribution }: Props) {
  const data = generateStackedData(timeDistribution);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <h3 className="text-base font-bold text-gray-800 mb-1">Phân bổ thời gian theo buổi</h3>
      <p className="text-xs text-gray-400 mb-5">Stacked bar – phân loại theo môn học</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
              formatter={(v: unknown) => [`${v}%`, '']}
              cursor={{ fill: 'rgba(99,102,241,0.04)' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            {(Object.keys(SUBJECT_COLORS) as (keyof typeof SUBJECT_COLORS)[]).map(subject => (
              <Bar key={subject} dataKey={subject} stackId="a" fill={SUBJECT_COLORS[subject]} radius={subject === 'Lý' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
