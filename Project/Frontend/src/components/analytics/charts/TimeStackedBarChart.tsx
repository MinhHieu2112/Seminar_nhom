'use client';

import { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TimeBreakdownPoint } from '@/hooks/useAnalyticsDashboard';

const SESSION_COLORS = ['#10b981', '#6366f1', '#f59e0b'];

interface Props {
  timeBreakdown: TimeBreakdownPoint[];
}

export const TimeStackedBarChart = memo(function TimeStackedBarChart({
  timeBreakdown = [],
}: Props) {
  const data = (timeBreakdown || []).map((item) => ({
    ...item,
    hours: Math.round(((item?.minutes || 0) / 60) * 10) / 10,
  }));
  const isEmpty = !data.length || data.every((item) => (item?.minutes || 0) === 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <h3 className="text-base font-bold text-gray-800 mb-1">
        Phân bổ thời gian theo buổi
      </h3>
      <p className="text-xs text-gray-400 mb-5">
        Dữ liệu thật từ các phiên học đã được phân bổ
      </p>

      <div className="h-64">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Chưa có phiên học nào trong giai đoạn đã chọn
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                }}
                formatter={(
                  _value: unknown,
                  _name: unknown,
                  item: {
                    payload?: {
                      percentage: number;
                      hours: number;
                    };
                  },
                ) => [
                  `${item.payload?.percentage ?? 0}% • ${item.payload?.hours ?? 0}h`,
                  'Thời lượng',
                ]}
                cursor={{ fill: 'rgba(99,102,241,0.04)' }}
              />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]} maxBarSize={72}>
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={SESSION_COLORS[index % SESSION_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
