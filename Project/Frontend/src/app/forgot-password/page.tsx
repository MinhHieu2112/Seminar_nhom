'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas';
import { passwordService } from '@/services/password.service';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Check, EnvelopeSimple, Warning, CircleNotch, ArrowLeft, ArrowRight } from '@phosphor-icons/react';

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
      const response = await passwordService.forgot({ email: data.email });
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
          <div className="fp-success-icon bg-emerald-100 text-emerald-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={28} weight="bold" />
          </div>
          <h2 className="fp-success-title">Kiểm tra email của bạn</h2>
          <p className="fp-success-desc">
            Nếu tài khoản tồn tại, chúng tôi đã gửi mã khôi phục mật khẩu đến{' '}
            <strong>{submittedEmail}</strong>.
          </p>

          {otpCode && countdown > 0 && (
            <div style={{ marginTop: 20, marginBottom: 20, padding: 15, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px 0', color: '#166534', fontSize: 14 }}>Mã OTP tự động (sẽ ẩn sau {countdown}s):</p>
              <div style={{ fontSize: 32, letterSpacing: 8, fontWeight: 'bold', color: '#15803d' }}>
                {otpCode}
              </div>
            </div>
          )}

          <Link
            href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
            className="fp-btn-primary flex items-center justify-center gap-2"
            id="fp-enter-code"
          >
            Nhập mã khôi phục <ArrowRight size={18} weight="bold" />
          </Link>
          <p className="fp-back-link">
            <Link href="/login" className="fp-link flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Quay lại đăng nhập
            </Link>
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
              <Warning size={18} weight="fill" />
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
                className={`fp-input${errors.email ? ' lf-input--error' : ''}`}
                placeholder="Địa chỉ email của bạn"
              />
              <div className="fp-input-icon">
                <EnvelopeSimple size={18} />
              </div>
            </div>
            {errors.email && <p className="fp-field-error">{errors.email.message}</p>}
          </div>

          <button id="forgot-submit" type="submit" disabled={isSubmitting} className="fp-btn-primary">
            {isSubmitting ? (
              <>
                <CircleNotch className="animate-spin" size={18} />
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
