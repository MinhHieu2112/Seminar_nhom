'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas';
import { passwordService } from '@/services/password.service';
import {
  EnvelopeSimple,
  Warning,
  CircleNotch,
  ArrowRight,
  Check,
} from '@phosphor-icons/react';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthSlidingFormProps {
  initialMode?: 'login' | 'register';
}

export function AuthSlidingForm({ initialMode = 'login' }: AuthSlidingFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // ── Forgot-password inline form state ──────────────────────────────────────
  const [fpSubmitted, setFpSubmitted] = useState(false);
  const [fpError, setFpError]         = useState('');
  const [fpEmail, setFpEmail]         = useState('');
  const [fpOtp, setFpOtp]             = useState<string | null>(null);
  const [fpCountdown, setFpCountdown] = useState(10);

  useEffect(() => {
    if (fpOtp && fpCountdown > 0) {
      const t = setTimeout(() => setFpCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [fpOtp, fpCountdown]);

  const {
    register: fpRegister,
    handleSubmit: fpHandleSubmit,
    formState: { errors: fpErrors, isSubmitting: fpSubmitting },
    reset: fpReset,
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onFpSubmit = async (data: ForgotPasswordFormData) => {
    setFpError('');
    try {
      const res = await passwordService.forgot({ email: data.email });
      setFpEmail(data.email);
      if (res.data.otp) { setFpOtp(res.data.otp); setFpCountdown(10); }
      setFpSubmitted(true);
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (axErr.response?.status === 429) {
        setFpError('Quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.');
      } else {
        setFpError(axErr.response?.data?.error?.message || 'Gửi email thất bại. Vui lòng thử lại.');
      }
    }
  };

  // Reset forgot form when leaving the panel
  const goToLogin = () => {
    setMode('login');
    setFpSubmitted(false);
    setFpError('');
    setFpOtp(null);
    fpReset();
  };

  // ── CSS class for container ─────────────────────────────────────────────────
  const containerClass = [
    'as-container',
    mode === 'register' ? 'right-panel-active' : '',
    mode === 'forgot'   ? 'forgot-panel-active' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="auth-sliding-wrapper">

      {/* ── Decorative background shapes ─────────────────────── */}
      {/* Rotating asterisk — top left */}
      <div className="as-deco as-deco--star-tl" aria-hidden="true">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 10 L100 190 M10 100 L190 100 M25.1 25.1 L174.9 174.9 M174.9 25.1 L25.1 174.9"
            stroke="#c4b5fd" strokeWidth="36" strokeLinecap="round" />
        </svg>
      </div>

      {/* Rotating asterisk — bottom right (smaller, slower) */}
      <div className="as-deco as-deco--star-br" aria-hidden="true">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 10 L100 190 M10 100 L190 100 M25.1 25.1 L174.9 174.9 M174.9 25.1 L25.1 174.9"
            stroke="#ddd6fe" strokeWidth="30" strokeLinecap="round" />
        </svg>
      </div>

      {/* Floating blob — bottom left */}
      <div className="as-deco as-deco--blob-bl" aria-hidden="true">
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150 30 C200 10, 270 70, 260 130 C250 190, 190 250, 130 260 C70 270, 20 210, 30 150 C40 90, 100 50, 150 30Z"
            fill="#ede9fe" opacity="0.8" />
        </svg>
      </div>

      {/* Floating blob — top right */}
      <div className="as-deco as-deco--blob-tr" aria-hidden="true">
        <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M120 20 C170 15, 220 60, 215 110 C210 160, 165 205, 115 210 C65 215, 20 170, 25 120 C30 70, 70 25, 120 20Z"
            fill="#f3e8ff" opacity="0.85" />
        </svg>
      </div>

      {/* Small floating dots */}
      <div className="as-deco as-deco--dot1" aria-hidden="true" />
      <div className="as-deco as-deco--dot2" aria-hidden="true" />
      <div className="as-deco as-deco--dot3" aria-hidden="true" />

      <div className={containerClass} id="as-container">

        {/* ── Sign-Up Form ─────────────────────────────────────── */}
        <div className="as-form-container as-sign-up-container">
          <div className="as-form-content">
            <RegisterForm isSliding={true} />
            <div className="as-mobile-toggle" onClick={() => setMode('login')}>
              Đã có tài khoản? <span>Đăng nhập</span>
            </div>
          </div>
        </div>

        {/* ── Sign-In Form ─────────────────────────────────────── */}
        <div className="as-form-container as-sign-in-container">
          <div className="as-form-content">
            <Suspense fallback={null}>
              <LoginForm isSliding={true} onForgotPassword={() => setMode('forgot')} />
            </Suspense>
            <div className="as-mobile-toggle" onClick={() => setMode('register')}>
              Chưa có tài khoản? <span>Đăng ký</span>
            </div>
          </div>
        </div>

        {/* ── Forgot-Password Inline Panel ─────────────────────── */}
        <div className="as-form-container as-forgot-container">
          <div className="as-form-content">
            {!fpSubmitted ? (
              <>
                <h1 className="lf-title" style={{ marginBottom: 8 }}>Quên mật khẩu</h1>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' }}>
                  Nhập email và chúng tôi sẽ gửi mã khôi phục cho bạn.
                </p>

                <form onSubmit={fpHandleSubmit(onFpSubmit)} className="lf-form" style={{ width: '100%' }}>
                  {fpError && (
                    <div className="fp-error-banner" role="alert">
                      <Warning size={16} weight="fill" /> {fpError}
                    </div>
                  )}
                  <div className="lf-field">
                    <div className="lf-input-wrapper">
                      <input
                        {...fpRegister('email')}
                        id="fp-email"
                        type="email"
                        autoComplete="email"
                        className={`fp-input${fpErrors.email ? ' lf-input--error' : ''}`}
                        placeholder="Địa chỉ email của bạn"
                      />
                      <div className="fp-input-icon"><EnvelopeSimple size={18} /></div>
                    </div>
                    {fpErrors.email && <p className="fp-field-error">{fpErrors.email.message}</p>}
                  </div>

                  <button type="submit" disabled={fpSubmitting} className="fp-btn-primary">
                    {fpSubmitting
                      ? <><CircleNotch className="animate-spin" size={18} /> Đang gửi...</>
                      : 'Gửi mã khôi phục'}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 8 }}>
                    Nhớ mật khẩu?{' '}
                    <button type="button" onClick={goToLogin} className="fp-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                      Đăng nhập
                    </button>
                  </p>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="fp-success" style={{ width: '100%' }}>
                <div className="fp-success-icon" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
                  <Check size={26} weight="bold" />
                </div>
                <h2 className="fp-success-title">Kiểm tra email!</h2>
                <p className="fp-success-desc">
                  Chúng tôi đã gửi mã khôi phục đến <strong>{fpEmail}</strong>.
                </p>

                {fpOtp && fpCountdown > 0 ? (
                  <div style={{ padding: '12px 20px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, textAlign: 'center', width: '100%' }}>
                    <p style={{ margin: '0 0 6px', color: '#6d28d9', fontSize: 13 }}>
                      Mã OTP (ẩn sau {fpCountdown}s):
                    </p>
                    <div style={{ fontSize: 28, letterSpacing: 8, fontWeight: 700, color: '#7c3aed' }}>{fpOtp}</div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, textAlign: 'center', width: '100%' }}>
                    <p style={{ margin: 0, color: '#166534', fontSize: 13, fontWeight: 500 }}>
                      Mã OTP khôi phục đã được gửi qua hòm thư Email của bạn.
                    </p>
                  </div>
                )}

                <Link
                  href={`/reset-password?email=${encodeURIComponent(fpEmail)}`}
                  className="fp-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', width: '100%' }}
                >
                  Nhập mã khôi phục <ArrowRight size={18} weight="bold" />
                </Link>

                <button type="button" onClick={goToLogin}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b5cf6', fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                  ← Quay lại đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Sliding Overlay ───────────────────────────────────── */}
        <div className="as-overlay-container">
          <div className="as-overlay">
            {/* Left panel — visible when Register is active */}
            <div className="as-overlay-panel as-overlay-left">
              <h1 className="as-overlay-title">Chào mừng trở lại!</h1>
              <p className="as-overlay-text">
                Để tiếp tục kết nối với chúng tôi, vui lòng đăng nhập bằng tài khoản của bạn
              </p>
              <button className="as-btn-ghost" onClick={() => setMode('login')}>
                Đăng nhập
              </button>
            </div>

            {/* Right panel — visible when Login or Forgot is active */}
            <div className="as-overlay-panel as-overlay-right">
              {mode === 'forgot' ? (
                <>
                  <h1 className="as-overlay-title">Nhớ mật khẩu?</h1>
                  <p className="as-overlay-text">
                    Quay lại và đăng nhập ngay với tài khoản của bạn
                  </p>
                  <button className="as-btn-ghost" onClick={goToLogin}>
                    Đăng nhập
                  </button>
                </>
              ) : (
                <>
                  <h1 className="as-overlay-title">Xin chào!</h1>
                  <p className="as-overlay-text">
                    Nhập thông tin cá nhân của bạn để bắt đầu hành trình cùng chúng tôi
                  </p>
                  <button className="as-btn-ghost" onClick={() => setMode('register')}>
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
