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
} from 'recharts';
import { BarChart2, Calendar, Clock, Target } from 'lucide-react';
import { useAnalyticsDashboard, useAnalyticsHistory } from '@/lib/hooks/useAnalytics';

export function AnalyticsView() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const { data: history = [], isLoading } = useAnalyticsHistory(period);
  const { data: analytics } = useAnalyticsDashboard();

  const totalPlanned = history.reduce((total, item) => total + item.planned, 0);
  const totalActual = history.reduce((total, item) => total + item.actual, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Analysis</h1>
          <p className="text-gray-500">
            Track your study habits and progress over time
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
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <BarChart2 className="h-5 w-5 text-blue-500" />
          Study Hours
        </h2>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center text-gray-500">
            Loading data...
          </div>
        ) : history.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-gray-500">
            <BarChart2 className="mb-2 h-12 w-12 text-gray-300" />
            <p>No study data found for this period</p>
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
                    const date = new Date(value);
                    return period === 'yearly'
                      ? date.toLocaleString('default', { month: 'short' })
                      : date.getDate().toString();
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
                  name="Planned Hours"
                  dataKey="planned"
                  fill="#93c5fd"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="Actual Hours"
                  dataKey="actual"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Total Planned</h3>
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
            <h3 className="font-medium text-gray-900">Total Actual</h3>
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
            <h3 className="font-medium text-gray-900">Completion Rate</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.completionRate ?? 0}%
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-medium text-gray-900">Overdue Tasks</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.summary?.overdueTasks ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
