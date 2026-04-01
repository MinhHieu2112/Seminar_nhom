'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/sign-in');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userStats = analytics?.user_stats;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user?.username}!</h1>
        <p className="text-gray-400">Your learning journey starts here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-300">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{userStats?.lessons_completed || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Lessons Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-300">Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{userStats?.exercises_solved || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-300">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{userStats?.current_streak || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Days</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Your Progress</h2>
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{userStats?.total_solved || 0}</p>
                <p className="text-sm text-gray-400">Total Solved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{userStats?.easy_solved || 0}</p>
                <p className="text-sm text-gray-400">Easy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{userStats?.medium_solved || 0}</p>
                <p className="text-sm text-gray-400">Medium</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{userStats?.hard_solved || 0}</p>
                <p className="text-sm text-gray-400">Hard</p>
              </div>
            </div>
            {userStats?.global_rank && (
              <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-center text-gray-400">
                  {'Global Rank: '}
                  <span className="text-purple-400 font-bold">
                    {'#'}{userStats.global_rank}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Continue Learning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="bg-slate-900/50 border-purple-500/20 hover:border-purple-500/50 transition-colors cursor-pointer"
            onClick={() => router.push('/courses')}
          >
            <CardContent className="pt-6">
              <p className="text-lg font-semibold text-white mb-2">Explore Courses</p>
              <p className="text-sm text-gray-400">Continue your learning journey with our comprehensive courses.</p>
            </CardContent>
          </Card>
          <Card
            className="bg-slate-900/50 border-purple-500/20 hover:border-purple-500/50 transition-colors cursor-pointer"
            onClick={() => router.push('/practice')}
          >
            <CardContent className="pt-6">
              <p className="text-lg font-semibold text-white mb-2">Practice Coding</p>
              <p className="text-sm text-gray-400">Sharpen your skills with coding exercises.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
