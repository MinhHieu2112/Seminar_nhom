'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterFormData } from '@/lib/schemas';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import type { ApiResponse, AuthResponse } from '@/types/api';
import { 
  User, 
  EnvelopeSimple, 
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
      const response = await authService.register({
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
            <Warning size={18} weight="fill" />
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
                            <User size={18} />
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
                            <User size={18} />
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
              <EnvelopeSimple size={18} />
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
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
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
              {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="rf-field-error">{errors.confirmPassword.message}</p>}
        </div>

        {/* Submit */}
        <button id="register-submit" type="submit" disabled={isLoading} className="rf-btn-primary">
          {isLoading ? (
            <>
              <CircleNotch className="animate-spin" size={18} />
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
