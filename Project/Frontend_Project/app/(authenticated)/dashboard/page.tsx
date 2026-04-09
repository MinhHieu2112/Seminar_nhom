'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Code2, Flame, Trophy, Target, TrendingUp } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg shadow-purple-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">👋</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.username || 'Learner'}!</h1>
            <p className="text-white/80">Ready to continue your coding journey?</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Target className="w-4 h-4" />
          <span>You&apos;re on a {userStats?.current_streak || 0} day streak! Keep it up!</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Courses</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{userStats?.lessons_completed || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Lessons Completed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Exercises</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{userStats?.exercises_solved || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Streak</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{userStats?.current_streak || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Your Progress</CardTitle>
              <p className="text-sm text-gray-500">Keep pushing your limits!</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{userStats?.total_solved || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Total Solved</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-50">
              <p className="text-2xl font-bold text-green-600">{userStats?.easy_solved || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Easy</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-600">{userStats?.medium_solved || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Medium</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-50">
              <p className="text-2xl font-bold text-red-600">{userStats?.hard_solved || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Hard</p>
            </div>
          </div>
          {userStats?.global_rank && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>Global Rank:</span>
                <span className="text-purple-600 font-bold">{'#'}{userStats.global_rank}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Learning */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Continue Learning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/courses')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Explore Courses</h3>
                  <p className="text-sm text-gray-500">Continue your learning journey with our comprehensive courses.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-0 shadow-lg bg-white hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => router.push('/practice')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Practice Coding</h3>
                  <p className="text-sm text-gray-500">Sharpen your skills with coding exercises.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
