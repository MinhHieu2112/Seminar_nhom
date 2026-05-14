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

const FACEBOOK_AUTH_URL =
  process.env.NEXT_PUBLIC_FACEBOOK_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/facebook';

const GITHUB_AUTH_URL =
  process.env.NEXT_PUBLIC_GITHUB_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/github';

const LINKEDIN_AUTH_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_AUTH_URL ||
  'http://localhost:8000/api/v1/auth/linkedin';


interface RegisterFormProps {
  isSliding?: boolean;
}

export function RegisterForm({ isSliding = false }: RegisterFormProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        firstName: data.firstName,
        lastName: data.lastName,
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
      {!isSliding && (
        <div className="rf-header">
          <h1 className="rf-title">Tạo tài khoản</h1>
          <p className="rf-subtitle">để bắt đầu lên kế hoạch học tập với StudyPlan.</p>
        </div>
      )}
      {isSliding && (
        <h1 className="rf-title">Tạo tài khoản</h1>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="rf-form">
        {error && (
          <div className="rf-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            {error}
          </div>
        )}

            {/* Name Fields */}
            <div className="flex gap-4">
                <div className="rf-field flex-1">
                    <div className="rf-input-wrapper">
                        <input
                            {...register('firstName')}
                            id="register-firstName"
                            type="text"
                            className={`rf-input${errors.firstName ? ' rf-input--error' : ''}`}
                            placeholder="Họ"
                        />
                        <div className="rf-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    </div>
                    {errors.firstName && <p className="rf-field-error">{errors.firstName.message}</p>}
                </div>

                <div className="rf-field flex-1">
                    <div className="rf-input-wrapper">
                        <input
                            {...register('lastName')}
                            id="register-lastName"
                            type="text"
                            className={`rf-input${errors.lastName ? ' rf-input--error' : ''}`}
                            placeholder="Tên"
                        />
                        <div className="rf-input-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    </div>
                    {errors.lastName && <p className="rf-field-error">{errors.lastName.message}</p>}
                </div>
            </div>

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
        <div className="rf-divider" style={{ margin: '20px 0 10px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>Hoặc đăng ký bằng</span>
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
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239-5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </div>
        </div>

        {/* Terms */}
        <p className="rf-terms">
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <Link href="#" className="rf-link">Điều khoản dịch vụ</Link>
          {' '}và{' '}
          <Link href="#" className="rf-link">Chính sách quyền riêng tư</Link>.
        </p>

        {!isSliding && (
          <p className="rf-login-link">
            Đã có tài khoản?{' '}
            <Link href="/login" className="rf-link rf-link--bold">Đăng nhập</Link>
          </p>
        )}
      </form>
    </>
  );
}
