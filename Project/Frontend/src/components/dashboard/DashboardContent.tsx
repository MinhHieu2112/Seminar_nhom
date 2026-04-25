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
          Chào mừng trở lại, {user?.email?.split('@')[0] ?? 'bạn'}! 👋
        </h1>
        <p className="mt-2 text-blue-100">
          Sẵn sàng đạt được mục tiêu hôm nay chưa? Hãy cùng nhau tiến bộ.
        </p>
      </div>



      {analytics?.suggestions && analytics.suggestions.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-blue-500" />
            Gợi ý từ AI
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
        <h2 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            href="/scheduler/goals"
            className="flex items-center gap-4 rounded-xl border-2 border-dashed border-blue-200 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Quản lý mục tiêu</p>
              <p className="text-sm text-gray-500">
                Tạo và theo dõi mục tiêu của bạn
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
              <p className="font-medium text-gray-900">Xem lịch trình</p>
              <p className="text-sm text-gray-500">Xem kế hoạch học tập của bạn</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
