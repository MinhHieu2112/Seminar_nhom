'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { ApiResponse, AuthResponse } from '@/types/api';

const GOOGLE_AUTH_URL =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/google';


export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  
  const urlError = searchParams.get('error');
  const [error, setError] = useState<string>(urlError ? decodeURIComponent(urlError) : '');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      const payload = response.data as AuthResponse | ApiResponse<AuthResponse>;
      const result = 'accessToken' in payload ? payload : payload.data;
      if (!result) {
        throw new Error('Missing auth payload');
      }
      const { accessToken, refreshToken, user } = result;
      login(accessToken, refreshToken, user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="lf-header">
        <h1 className="lf-title">Đăng nhập</h1>
        <p className="lf-subtitle">để tiếp tục với tài khoản StudyPlan của bạn.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="lf-form">
        {error && (
          <div className="lf-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="lf-field">
          <div className="lf-input-wrapper">
            <input
              {...register('email')}
              id="login-email"
              type="email"
              autoComplete="email"
              className={`lf-input${errors.email ? ' lf-input--error' : ''}`}
              placeholder="Địa chỉ email hoặc Tên đăng nhập"
            />
            <div className="lf-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          {errors.email && <p className="lf-field-error">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div className="lf-field">
          <div className="lf-input-wrapper">
            <input
              {...register('password')}
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={`lf-input${errors.password ? ' lf-input--error' : ''}`}
              placeholder="Mật khẩu"
            />
          </div>
          {errors.password && <p className="lf-field-error">{errors.password.message}</p>}
        </div>

        {/* Forgot Password */}
        <div className="lf-forgot">
          <Link href="/forgot-password" className="lf-link--muted">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button id="login-submit" type="submit" disabled={isLoading} className="lf-btn-primary">
          {isLoading ? (
            <>
              <span className="lf-spinner" />
              Đang đăng nhập...
            </>
          ) : (
            'Tiếp tục'
          )}
        </button>

        {/* Divider */}
        <div className="lf-divider">
          <span>hoặc</span>
        </div>

        {/* Social Buttons */}
        <div>
          <button
            type="button"
            className="lf-btn-social"
            id="login-google"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z" />
            </svg>
            Tiếp tục với Google
          </button>
        </div>

        {/* Register Link */}
        <p className="lf-register-link">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="lf-link">Đăng ký</Link>
        </p>
        <p className="lf-register-link">
          Không thể đăng nhập?{' '}
          <Link href="/forgot-password" className="lf-link">Nhấn vào đây</Link>
        </p>
      </form>
    </>
  );
}
