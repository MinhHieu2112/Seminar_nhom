'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import type { User } from '@/types/api';

/**
 * Trang callback sau khi Google OAuth hoàn tất.
 * API Gateway redirect về đây với accessToken, refreshToken, user (JSON encoded).
 * Nếu có lỗi, redirect về trang login kèm thông báo.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userRaw = searchParams.get('user');
    const error = searchParams.get('error');

    // Có lỗi từ backend → redirect về login với thông báo
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!accessToken || !refreshToken || !userRaw) {
      router.replace('/login?error=Đăng+nhập+thất+bại.+Vui+lòng+thử+lại.');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw)) as User;
      login(accessToken, refreshToken, user);
      router.replace('/dashboard');
    } catch {
      router.replace('/login?error=Không+thể+xử+lý+thông+tin+đăng+nhập.');
    }
  }, [searchParams, login, router]);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Spinner */}
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #e8f5e9',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            animation: 'authSpin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 15, color: '#555', margin: 0 }}>
            Đang hoàn tất đăng nhập với Google...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '4px solid #e8f5e9',
            borderTop: '4px solid #4CAF50',
            borderRadius: '50%',
            animation: 'authSpin 0.8s linear infinite',
          }} />
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
