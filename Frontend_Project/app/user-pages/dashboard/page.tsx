'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
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
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-xs text-gray-400 mt-1">Enrolled</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-300">Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-xs text-gray-400 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-300">Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-xs text-gray-400 mt-1">Days</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <p className="text-gray-300 mb-4">
                The dashboard is being set up with courses, practice exercises, and learning paths.
              </p>
              <p className="text-sm text-gray-400">
                More features coming soon! Check back soon for an amazing learning experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
