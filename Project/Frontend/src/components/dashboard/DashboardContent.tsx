'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { Target, Calendar, BookOpen, Clock } from 'lucide-react';

export function DashboardContent() {
  const { user } = useAuthStore();

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
      <div className="grid gap-6 md:grid-cols-3">
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
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

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
