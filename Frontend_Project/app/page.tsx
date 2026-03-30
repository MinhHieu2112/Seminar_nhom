'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth/sign-in');
      }
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
