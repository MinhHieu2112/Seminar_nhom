'use client';

import { memo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface RadarItem {
  metric: string;
  value: number;
}

interface Props {
  data?: RadarItem[];
}

export const PerformanceRadarChart = memo(function PerformanceRadarChart({ data = [] }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <h3 className="text-base font-bold text-gray-800 mb-1">Đánh giá năng lực</h3>
      <p className="text-xs text-gray-400 mb-2">Radar – tổng hợp chỉ số hoạt động nhóm</p>

      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Chưa có dữ liệu đánh giá
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#cbd5e1' }}
                axisLine={false}
              />
              <Radar
                name="Chỉ số"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ r: 4, fill: '#6366f1' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
                formatter={(v: unknown) => [`${v}/100`, '']}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
