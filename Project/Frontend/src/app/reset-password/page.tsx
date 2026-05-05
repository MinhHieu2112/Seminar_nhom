'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas';
import { passwordApi } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const emailQuery = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailQuery },
  });

  useEffect(() => {
    if (emailQuery) setValue('email', emailQuery);
  }, [emailQuery, setValue]);

  const handleVerifyOtp = async () => {
    const isEmailValid = await trigger('email');
    const isOtpValid = await trigger('otp');
    if (!isEmailValid || !isOtpValid) return;

    setError('');
    setIsVerifyingOtp(true);
    try {
      await passwordApi.verifyOtp({ email: getValues('email'), otp: getValues('otp') });
      setStep(2);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (axiosErr.response?.status === 400) {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
      } else {
        setError(axiosErr.response?.data?.error?.message || 'Lỗi kiểm tra OTP. Vui lòng thử lại.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    try {
      await passwordApi.reset({ email: data.email, otp: data.otp, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (axiosErr.response?.status === 429) {
        setError('Quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.');
      } else if (axiosErr.response?.status === 400) {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
        setStep(1);
      } else {
        setError(axiosErr.response?.data?.error?.message || 'Khôi phục mật khẩu thất bại. Vui lòng thử lại.');
      }
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <AuthLayout>
        <div className="rp-success">
          <div className="rp-success-icon"><CheckIcon /></div>
          <h2 className="rp-success-title">Khôi phục thành công!</h2>
          <p className="rp-success-desc">
            Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng đến trang đăng nhập...
          </p>
          <div className="rp-redirect-bar">
            <div className="rp-redirect-fill" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  /* ── Main form ── */
  return (
    <AuthLayout>
      <>
        {/* Progress indicator */}
        <div className="rp-progress">
          <div className={`rp-step${step < 1 ? ' rp-step--inactive' : ''}`}>
            <div className="rp-step-dot">
              {step > 1 ? <CheckIcon /> : '1'}
            </div>
            <span>Xác thực OTP</span>
          </div>
          <div className="rp-step-line" />
          <div className={`rp-step${step < 2 ? ' rp-step--inactive' : ''}`}>
            <div className="rp-step-dot">2</div>
            <span>Mật khẩu mới</span>
          </div>
        </div>

        <div className="rp-header">
          <h1 className="rp-title">Khôi phục mật khẩu</h1>
          <p className="rp-subtitle">
            {step === 1 ? 'Nhập mã OTP được gửi đến email của bạn' : 'Thiết lập mật khẩu mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rp-form">
          {error && (
            <div className="rp-error-banner" role="alert">
              <AlertIcon />
              {error}
            </div>
          )}

          {/* Step 1 */}
          <div style={{ display: step === 2 ? 'none' : 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="rp-field">
              <div className="rp-input-wrapper">
                <input
                  {...register('email')}
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  readOnly={!!emailQuery}
                  className={`rp-input${emailQuery ? ' rp-input--readonly' : ''}${errors.email ? ' rp-input--error' : ''}`}
                  placeholder="Email"
                />
              </div>
              {errors.email && <p className="rp-field-error">{errors.email.message}</p>}
            </div>

            <div className="rp-field">
              <div className="rp-input-wrapper">
                <input
                  {...register('otp')}
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  className={`rp-input rp-input--otp${errors.otp ? ' rp-input--error' : ''}`}
                />
              </div>
              {errors.otp && <p className="rp-field-error">{errors.otp.message}</p>}
            </div>

            <button
              type="button"
              id="reset-verify-otp"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
              className="rp-btn-primary"
            >
              {isVerifyingOtp ? <><span className="rp-spinner" /> Đang kiểm tra...</> : 'Tiếp tục'}
            </button>

            <p className="rp-help-link">
              Chưa nhận được mã?{' '}
              <Link href="/forgot-password" className="rp-link">Gửi lại</Link>
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ display: step === 1 ? 'none' : 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="rp-field">
              <div className="rp-input-wrapper">
                <input
                  {...register('newPassword')}
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  className={`rp-input${errors.newPassword ? ' rp-input--error' : ''}`}
                  placeholder="Mật khẩu mới"
                />
              </div>
              {errors.newPassword && <p className="rp-field-error">{errors.newPassword.message}</p>}
            </div>

            <div className="rp-field">
              <div className="rp-input-wrapper">
                <input
                  {...register('confirmNewPassword')}
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className={`rp-input${errors.confirmNewPassword ? ' rp-input--error' : ''}`}
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>
              {errors.confirmNewPassword && <p className="rp-field-error">{errors.confirmNewPassword.message}</p>}
            </div>

            <button id="reset-submit" type="submit" disabled={isSubmitting} className="rp-btn-primary">
              {isSubmitting ? <><span className="rp-spinner" /> Đang cập nhật...</> : 'Cập nhật mật khẩu'}
            </button>

            <button type="button" onClick={() => setStep(1)} className="rp-btn-ghost">
              ← Quay lại
            </button>
          </div>
        </form>
      </>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid #e8f5e9',
            borderTop: '3px solid #4CAF50',
            borderRadius: '50%',
            animation: 'authSpin 0.7s linear infinite',
          }} />
        </div>
      </AuthLayout>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
