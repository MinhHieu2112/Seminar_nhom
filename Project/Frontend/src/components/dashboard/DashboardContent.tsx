'use client';

import Link from 'next/link';
import { Activity, BookOpen, Calendar, Clock, Target, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';

export function DashboardContent() {
  const { user } = useAuthStore();
  const { data: analytics } = useAnalyticsDashboard();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.email?.split('@')[0] ?? 'there'}! 👋
        </h1>
        <p className="mt-2 text-blue-100">
          Ready to achieve your goals today? Let&apos;s make progress together.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.summary?.activeGoals ?? 0}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.summary?.pendingTasks ?? 0}
              </p>
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

      {analytics?.suggestions && analytics.suggestions.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-blue-500" />
            AI Insights
          </h2>
          <ul className="mt-4 space-y-2">
            {analytics.suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex gap-2 text-gray-700">
                <span className="text-blue-500">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <p className="text-sm text-gray-500">
                Create and track your goals
              </p>
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
