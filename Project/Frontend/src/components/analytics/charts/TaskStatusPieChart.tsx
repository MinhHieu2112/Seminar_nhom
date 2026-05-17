'use client';

import { memo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AnalyticsSummary } from '@/hooks/useAnalyticsDashboard';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const LABELS = ['Hoàn thành', 'Đang chờ', 'Trễ hạn'];

interface Props { summary: AnalyticsSummary; }

export const TaskStatusPieChart = memo(function TaskStatusPieChart({ summary }: Props) {
  const total = summary.individualTasks.total + summary.teamTasks.total;
  const completed = summary.individualTasks.completed + summary.teamTasks.completed;
  const overdue = summary.individualTasks.overdue + summary.teamTasks.overdue;
  const pending = Math.max(total - completed - overdue, 0);

  const chartData = [
    { name: 'Hoàn thành', value: completed },
    { name: 'Đang chờ',   value: pending },
    { name: 'Trễ hạn',    value: overdue },
  ].filter(d => d.value > 0);

  const isEmpty = chartData.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <h3 className="text-base font-bold text-gray-800 mb-1">Trạng thái Task</h3>
      <p className="text-xs text-gray-400 mb-4">Tỉ lệ hoàn thành / đang chờ / trễ hạn</p>

      {isEmpty ? (
        <div className="flex items-center justify-center h-64 text-gray-300">
          <div className="text-center">
            <div className="text-5xl mb-2">📊</div>
            <p className="text-sm">Chưa có dữ liệu</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((item, i) => {
                    const colorIndex = LABELS.indexOf(item.name);
                    return <Cell key={i} fill={COLORS[colorIndex]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
                  formatter={(value: unknown) => [`${value} task`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend */}
          <div className="flex flex-col gap-2 mt-2">
            {chartData.map((item, i) => {
              const colorIndex = LABELS.indexOf(item.name);
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[colorIndex] }} />
                    <span className="text-gray-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-800">{item.value}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});
