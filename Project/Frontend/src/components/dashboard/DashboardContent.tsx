'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Target, Calendar, BookOpen, Clock, Activity, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';

export function DashboardContent() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsApi.getDashboard();
        if (res.data.success) {
          setAnalytics(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Welcome back, {user?.email.split('@')[0]}! 👋</h1>
        <p className="mt-2 text-blue-100">
          Ready to achieve your goals today? Let&apos;s make progress together.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.completionRate ?? 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Productivity Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.productivityScore ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Insights */}
      {analytics?.suggestions && analytics.suggestions.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            AI Insights
          </h2>
          <ul className="mt-4 space-y-2">
            {analytics.suggestions.map((sug: string, idx: number) => (
              <li key={idx} className="flex gap-2 text-gray-700">
                <span className="text-blue-500">•</span>
                {sug}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            href="/scheduler/goals"
            className="flex items-center gap-4 rounded-xl border-2 border-dashed border-blue-200 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Goals</p>
              <p className="text-sm text-gray-500">Create and track your goals</p>
            </div>
          </Link>

          <Link
            href="/scheduler/schedule"
            className="flex items-center gap-4 rounded-xl border-2 border-dashed border-purple-200 p-4 transition-colors hover:border-purple-400 hover:bg-purple-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Schedule</p>
              <p className="text-sm text-gray-500">See your study plan</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
