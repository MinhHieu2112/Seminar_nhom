'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getAccessToken } from '@/lib/api-client';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const PUBLIC_PATHS = ['/login', '/register'];

export function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    // Check if we have a token on mount
    const token = getAccessToken();
    const refreshToken = document.cookie.includes('refreshToken');

    // If no tokens and on protected route, redirect to login
    if (!token && !refreshToken && requireAuth && !PUBLIC_PATHS.includes(pathname)) {
      setLoading(false);
      router.push('/login');
      return;
    }

    // If has token but store not initialized, we're still loading
    if ((token || refreshToken) && !isAuthenticated && isLoading) {
      // Wait for auth state to be restored (e.g., from persistent storage)
      return;
    }

    // If authenticated and on public route, redirect to dashboard
    if (isAuthenticated && PUBLIC_PATHS.includes(pathname)) {
      router.push('/dashboard');
      return;
    }

    // If requires admin but user is not admin
    if (requireAdmin && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [isAuthenticated, isLoading, pathname, requireAuth, requireAdmin, router, setLoading, user?.role]);

  // Show nothing while checking auth (prevents flash)
  if (isLoading && requireAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
