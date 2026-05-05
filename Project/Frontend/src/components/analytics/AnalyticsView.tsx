'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart2, Calendar, Clock, Target, CheckSquare, PieChart as PieChartIcon } from 'lucide-react';
import { useAnalyticsDashboard, useAnalyticsHistory } from '@/lib/hooks/useAnalytics';

const PIE_COLORS = ['#10b981', '#fcd34d', '#ef4444'];

export function AnalyticsView() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const { data: history = [], isLoading } = useAnalyticsHistory(period);
  const { data: analytics } = useAnalyticsDashboard();

  const totalPlanned = history.reduce((total, item) => total + item.planned, 0);
  const totalActual = history.reduce((total, item) => total + item.actual, 0);

  const completedBlocks = analytics?.summary?.completedBlocks ?? 0;
  const overdueBlocks = analytics?.summary?.overdueTasks ?? 0;
  const plannedBlocks = analytics?.summary?.plannedBlocks ?? 0;
  // Ensure pending is not negative
  const pendingBlocks = Math.max(plannedBlocks - completedBlocks - overdueBlocks, 0);

  const taskStatusData = [
    { name: 'Hoàn thành', value: completedBlocks },
    { name: 'Đang chờ', value: pendingBlocks },
    { name: 'Trễ hạn', value: overdueBlocks },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân tích học tập</h1>
          <p className="text-gray-500">
            Theo dõi thói quen và tiến độ học tập của bạn
          </p>
        </div>
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(['weekly', 'monthly', 'yearly'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {value === 'weekly' ? 'Tuần' : value === 'monthly' ? 'Tháng' : 'Năm'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Giờ đã lên kế hoạch</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalPlanned.toFixed(1)}h
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Giờ đã học thực tế</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalActual.toFixed(1)}h
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Tỷ lệ hoàn thành</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.completionRate ?? 0}%
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <CheckSquare className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-medium text-gray-900">Phiên trễ hạn</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.summary?.overdueTasks ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Bar Chart - Hours */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BarChart2 className="h-5 w-5 text-blue-500" />
            Biểu đồ giờ học
          </h2>

          {isLoading ? (
            <div className="flex h-80 items-center justify-center text-gray-500">
              Đang tải...
            </div>
          ) : history.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center text-gray-500">
              <BarChart2 className="mb-2 h-12 w-12 text-gray-300" />
              <p>Chưa có dữ liệu học tập trong kỳ này</p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={history}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (period === 'monthly' || period === 'yearly') return value;
                      
                      try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;
                        const day = date.getDay();
                        const labels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                        return labels[day];
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend iconType="circle" />
                  <Bar
                    name="Giờ kế hoạch"
                    dataKey="planned"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    name="Giờ thực tế"
                    dataKey="actual"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart - Task Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <PieChartIcon className="h-5 w-5 text-purple-500" />
            Trạng thái hoàn thành
          </h2>
          <div className="flex h-80 flex-col items-center justify-center">
            {taskStatusData.every(d => d.value === 0) ? (
               <div className="text-gray-500 flex flex-col items-center">
                  <PieChartIcon className="h-10 w-10 text-gray-300 mb-2" />
                  Chưa có dữ liệu
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      </div>
  );
}
