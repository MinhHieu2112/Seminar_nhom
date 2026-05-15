'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import type { ApiResponse, AuthResponse } from '@/types/api';
import { 
  User, 
  Eye, 
  EyeSlash, 
  Warning,
  GoogleLogo,
  FacebookLogo,
  GithubLogo,
  LinkedinLogo,
  CircleNotch
} from '@phosphor-icons/react';

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
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await authService.login({
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
            <Warning size={16} weight="fill" />
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
              <User size={18} />
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
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`lf-input${errors.password ? ' lf-input--error' : ''}`}
              placeholder="Mật khẩu"
            />
            <button
              type="button"
              className="lf-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
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
              <CircleNotch className="animate-spin" size={18} />
              Đăng nhập...
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
            <GoogleLogo size={20} weight="bold" className="text-[#4285F4]" />
          </div>
          <div className="as-social-icon" title="Facebook" onClick={handleFacebookLogin}>
            <FacebookLogo size={20} weight="fill" className="text-[#1877F2]" />
          </div>
          <div className="as-social-icon" title="Github" onClick={handleGithubLogin}>
            <GithubLogo size={20} weight="fill" className="text-[#181717]" />
          </div>
          <div className="as-social-icon" title="LinkedIn" onClick={handleLinkedinLogin}>
            <LinkedinLogo size={20} weight="fill" className="text-[#0A66C2]" />
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
