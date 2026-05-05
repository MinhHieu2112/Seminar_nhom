'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterFormData } from '@/lib/schemas';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { ApiResponse, AuthResponse } from '@/types/api';

const GOOGLE_AUTH_URL =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/google';


export function RegisterForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
      });

      const payload = response.data as AuthResponse | ApiResponse<AuthResponse>;
      const result = 'accessToken' in payload ? payload : payload.data;
      if (!result) throw new Error('Missing auth payload');

      const { accessToken, refreshToken, user } = result;
      login(accessToken, refreshToken, user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <>
      <div className="rf-header">
        <h1 className="rf-title">Tạo tài khoản</h1>
        <p className="rf-subtitle">để bắt đầu lên kế hoạch học tập với StudyPlan.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rf-form">
        {error && (
          <div className="rf-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {error}
          </div>
        )}

        {/* Email */}
        <div className="rf-field">
          <div className="rf-input-wrapper">
            <input
              {...register('email')}
              id="register-email"
              type="email"
              autoComplete="email"
              className={`rf-input${errors.email ? ' rf-input--error' : ''}`}
              placeholder="Địa chỉ email"
            />
            <div className="rf-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>
          {errors.email && <p className="rf-field-error">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="rf-field">
          <div className="rf-input-wrapper">
            <input
              {...register('password')}
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`rf-input${errors.password ? ' rf-input--error' : ''}`}
              placeholder="Mật khẩu"
            />
            <button
              type="button"
              className="rf-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="rf-field-error">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="rf-field">
          <div className="rf-input-wrapper">
            <input
              {...register('confirmPassword')}
              id="register-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className={`rf-input${errors.confirmPassword ? ' rf-input--error' : ''}`}
              placeholder="Xác nhận mật khẩu"
            />
            <button
              type="button"
              className="rf-toggle-btn"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.confirmPassword && <p className="rf-field-error">{errors.confirmPassword.message}</p>}
        </div>

        {/* Submit */}
        <button id="register-submit" type="submit" disabled={isLoading} className="rf-btn-primary">
          {isLoading ? (
            <>
              <span className="rf-spinner" />
              Đang tạo tài khoản...
            </>
          ) : (
            'Tạo tài khoản'
          )}
        </button>

        {/* Divider */}
        <div className="rf-divider">
          <span>hoặc</span>
        </div>

        {/* Google */}
        <div>
          <button
            type="button"
            className="rf-btn-social"
            id="register-google"
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

        {/* Terms */}
        <p className="rf-terms">
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <Link href="#" className="rf-link">Điều khoản dịch vụ</Link>
          {' '}và{' '}
          <Link href="#" className="rf-link">Chính sách quyền riêng tư</Link>.
        </p>

        {/* Login Link */}
        <p className="rf-login-link">
          Đã có tài khoản?{' '}
          <Link href="/login" className="rf-link rf-link--bold">Đăng nhập</Link>
        </p>
      </form>
    </>
  );
}
