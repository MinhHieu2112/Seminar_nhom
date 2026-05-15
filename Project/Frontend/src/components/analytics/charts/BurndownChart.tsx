'use client';

import { memo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

interface BurndownItem {
  day: string;
  remaining: number;
  ideal: number;
}

interface Props {
  data?: BurndownItem[];
}

export const BurndownChart = memo(function BurndownChart({ data = [] }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <h3 className="text-base font-bold text-gray-800 mb-1">Burn-down Chart</h3>
      <p className="text-xs text-gray-400 mb-5">Workload còn lại so với tiến độ lý tưởng</p>

      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Chưa có dữ liệu Burn-down
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                axisLine={false} tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
                formatter={(v: unknown) => [`${v} task`, '']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line
                name="Thực tế"
                type="monotone"
                dataKey="remaining"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                name="Lý tưởng"
                type="monotone"
                dataKey="ideal"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
