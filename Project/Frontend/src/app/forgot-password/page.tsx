'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas';
import { passwordApi } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (otpCode && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setOtpCode(null);
    }
  }, [otpCode, countdown]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    try {
      const response = await passwordApi.forgot({ email: data.email });
      setSubmittedEmail(data.email);
      if (response.data.otp) {
        setOtpCode(response.data.otp);
        setCountdown(10);
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { error?: { message?: string } } };
      };
      if (axiosErr.response?.status === 429) {
        setError('Quá nhiều yêu cầu. Vui lòng đợi trước khi yêu cầu mã OTP khác.');
      } else {
        const message =
          axiosErr.response?.data?.error?.message ||
          'Gửi email khôi phục thất bại. Vui lòng thử lại.';
        setError(message);
      }
    }
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div className="fp-success">
          <div className="fp-success-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="fp-success-title">Kiểm tra email của bạn</h2>
          <p className="fp-success-desc">
            Nếu tài khoản tồn tại, chúng tôi đã gửi mã khôi phục mật khẩu đến{' '}
            <strong>{submittedEmail}</strong>.
          </p>

          {otpCode && (
            <div style={{ marginTop: 20, marginBottom: 20, padding: 15, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px 0', color: '#166534', fontSize: 14 }}>Mã OTP tự động (sẽ ẩn sau {countdown}s):</p>
              <div style={{ fontSize: 32, letterSpacing: 8, fontWeight: 'bold', color: '#15803d' }}>
                {otpCode}
              </div>
            </div>
          )}

          <Link
            href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
            className="fp-btn-primary"
            id="fp-enter-code"
          >
            Nhập mã khôi phục →
          </Link>
          <p className="fp-back-link">
            <Link href="/login" className="fp-link">← Quay lại đăng nhập</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <>
        <div className="fp-header">
          <h1 className="fp-title">Quên mật khẩu</h1>
          <p className="fp-subtitle">Nhập email và chúng tôi sẽ gửi mã khôi phục cho bạn.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="fp-form">
          {error && (
            <div className="fp-error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              {error}
            </div>
          )}

          <div className="fp-field">
            <div className="fp-input-wrapper">
              <input
                {...register('email')}
                id="forgot-email"
                type="email"
                autoComplete="email"
                className={`fp-input${errors.email ? ' fp-input--error' : ''}`}
                placeholder="Địa chỉ email của bạn"
              />
              <div className="fp-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>
            {errors.email && <p className="fp-field-error">{errors.email.message}</p>}
          </div>

          <button id="forgot-submit" type="submit" disabled={isSubmitting} className="fp-btn-primary">
            {isSubmitting ? (
              <>
                <span className="fp-spinner" />
                Đang gửi...
              </>
            ) : (
              'Gửi mã khôi phục'
            )}
          </button>

          <p className="fp-login-link">
            Nhớ mật khẩu?{' '}
            <Link href="/login" className="fp-link">Đăng nhập</Link>
          </p>
        </form>
      </>
    </AuthLayout>
  );
}
