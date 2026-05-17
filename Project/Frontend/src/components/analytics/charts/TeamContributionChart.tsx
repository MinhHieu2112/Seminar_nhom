'use client';

import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

type MetricKey = 'tasks' | 'hours';

interface ContributionItem {
  name: string;
  tasks: number;
  hours: number;
}

interface Props { 
  metric: MetricKey; 
  data?: ContributionItem[];
}

const GRADIENT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export const TeamContributionChart = memo(function TeamContributionChart({ metric, data = [] }: Props) {
  const sorted = [...data].sort((a, b) => b[metric] - a[metric]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-gray-800">Đóng góp thành viên</h3>
      </div>
      <p className="text-xs text-gray-400 mb-5">
        {metric === 'tasks' ? 'Số task hoàn thành' : 'Tổng giờ học'} theo thành viên
      </p>

      <div className="h-64">
        {sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Chưa có dữ liệu đóng góp
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                unit={metric === 'hours' ? 'h' : ''}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                width={80}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
                formatter={(v: unknown) => [`${v}${metric === 'hours' ? 'h' : ' tasks'}`, '']}
                cursor={{ fill: 'rgba(99,102,241,0.04)' }}
              />
              <Bar dataKey={metric} radius={[0, 6, 6, 0]} maxBarSize={20}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
