'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Users, BookOpen, Code, TrendingUp } from 'lucide-react';
import { SkeletonLoader } from '@/components/shared/loaders/SkeletonLoader';

interface AnalyticsData {
  totalUsers: number;
  totalCourses: number;
  totalSubmissions: number;
  successRate: string | number;
  activeUsersToday: number;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await adminService.getAnalyticsDashboard();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Analytics Dashboard"
        description="Platform metrics and monitoring"
      />

      {loading ? (
        <SkeletonLoader count={5} height="h-24" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          <StatCard
            icon={<Users size={24} />}
            label="Total Users"
            value={analytics?.totalUsers || 0}
          />
          <StatCard
            icon={<BookOpen size={24} />}
            label="Total Courses"
            value={analytics?.totalCourses || 0}
          />
          <StatCard
            icon={<Code size={24} />}
            label="Submissions"
            value={analytics?.totalSubmissions || 0}
          />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Success Rate"
            value={`${analytics?.successRate}%`}
          />
          <StatCard
            icon={<Users size={24} />}
            label="Active Today"
            value={analytics?.activeUsersToday || 0}
          />
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/admin/users"
              className="block px-4 py-3 bg-slate-800 hover:bg-purple-500/10 border border-slate-700 hover:border-purple-500 rounded-lg text-slate-300 hover:text-purple-400 transition-colors"
            >
              Manage Users
            </a>
            <a
              href="/admin/courses"
              className="block px-4 py-3 bg-slate-800 hover:bg-purple-500/10 border border-slate-700 hover:border-purple-500 rounded-lg text-slate-300 hover:text-purple-400 transition-colors"
            >
              Manage Courses
            </a>
            <a
              href="/admin/forum"
              className="block px-4 py-3 bg-slate-800 hover:bg-purple-500/10 border border-slate-700 hover:border-purple-500 rounded-lg text-slate-300 hover:text-purple-400 transition-colors"
            >
              Moderate Forum
            </a>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-slate-400">Database</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-400">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-slate-400">API</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-400">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Services</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-green-400">Operational</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
