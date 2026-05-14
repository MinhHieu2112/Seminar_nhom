'use client';

import { useState } from 'react';
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

const FACEBOOK_AUTH_URL =
  process.env.NEXT_PUBLIC_FACEBOOK_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/facebook';

const GITHUB_AUTH_URL =
  process.env.NEXT_PUBLIC_GITHUB_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/github';

const LINKEDIN_AUTH_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/linkedin';


interface LoginFormProps {
  isSliding?: boolean;
}

export function LoginForm({ isSliding = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  
  const urlError = searchParams.get('error');
  const [error, setError] = useState<string>(urlError ? decodeURIComponent(urlError) : '');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleFacebookLogin = () => {
    window.location.href = FACEBOOK_AUTH_URL;
  };

  const handleGithubLogin = () => {
    window.location.href = GITHUB_AUTH_URL;
  };

  const handleLinkedinLogin = () => {
    window.location.href = LINKEDIN_AUTH_URL;
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
      {!isSliding && (
        <div className="lf-header">
          <h1 className="lf-title">Đăng nhập</h1>
          <p className="lf-subtitle">để tiếp tục với tài khoản StudyPlan của bạn.</p>
        </div>
      )}
      {isSliding && (
        <h1 className="lf-title">Đăng nhập</h1>
      )}

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
        <div className="lf-forgot" style={isSliding ? { textAlign: 'center', margin: '5px 0' } : {}}>
          <Link href="/forgot-password" className="lf-link--muted" style={isSliding ? { fontSize: '12px' } : {}}>
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
        <div className="lf-divider" style={{ margin: '20px 0 10px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>Hoặc đăng nhập bằng</span>
        </div>

        {/* Social Icons Container */}
        <div className="as-social-container">
          <div className="as-social-icon" title="Google" onClick={handleGoogleLogin}>
            <svg width="20" height="20" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z" />
            </svg>
          </div>
          <div className="as-social-icon" title="Facebook" onClick={handleFacebookLogin}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div className="as-social-icon" title="Github" onClick={handleGithubLogin}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <div className="as-social-icon" title="LinkedIn" onClick={handleLinkedinLogin}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </div>
        </div>

        {!isSliding && (
          <>
            {/* Register Link */}
            <p className="lf-register-link">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="lf-link">Đăng ký</Link>
            </p>
            <p className="lf-register-link">
              Không thể đăng nhập?{' '}
              <Link href="/forgot-password" className="lf-link">Nhấn vào đây</Link>
            </p>
          </>
        )}
      </form>
    </>
  );
}
