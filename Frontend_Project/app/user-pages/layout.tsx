'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserNavbar } from '@/components/shared/UserNavbar';
import { UserSidebar } from '@/components/shared/UserSidebar';

// This layout wraps dashboard, courses, practice, projects, forum, learning-path, profile pages
export default function UserPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/sign-in');
    }
    // Redirect admins to admin panel  
    if (!loading && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <UserNavbar />
      <div className="flex flex-1 overflow-hidden">
        <UserSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
