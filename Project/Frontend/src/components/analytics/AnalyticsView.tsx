'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { analyticsApi } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart2, Calendar, Target, Clock } from 'lucide-react';

export function AnalyticsView() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.getHistory(period);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Analysis</h1>
          <p className="text-gray-500">Track your study habits and progress over time</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              period === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              period === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              period === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          Study Hours
        </h2>
        
        {loading ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            Loading data...
          </div>
        ) : data.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-gray-500">
            <BarChart2 className="w-12 h-12 text-gray-300 mb-2" />
            <p>No study data found for this period</p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => {
                    const date = new Date(val);
                    return period === 'yearly' 
                      ? date.toLocaleString('default', { month: 'short' })
                      : date.getDate().toString();
                  }}
                />
                <YAxis />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar name="Planned Hours" dataKey="planned" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar name="Actual Hours" dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Total Planned</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.reduce((acc, curr) => acc + curr.planned, 0).toFixed(1)}h
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Total Actual</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.reduce((acc, curr) => acc + curr.actual, 0).toFixed(1)}h
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Completion Rate</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.reduce((acc, curr) => acc + curr.planned, 0) > 0
              ? Math.round((data.reduce((acc, curr) => acc + curr.actual, 0) / data.reduce((acc, curr) => acc + curr.planned, 0)) * 100)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
