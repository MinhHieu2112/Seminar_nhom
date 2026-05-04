'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas';
import { passwordApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

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
      await passwordApi.forgot({ email: data.email });
      setSubmittedEmail(data.email);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Kiểm tra email của bạn</h2>
            <p className="mt-2 text-sm text-gray-600">
              Nếu tài khoản tồn tại, chúng tôi đã gửi mã khôi phục mật khẩu.
            </p>
            <Link
              href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
              className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Nhập mã khôi phục →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Quên mật khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Nhập email của bạn và chúng tôi sẽ gửi mã khôi phục
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi mã khôi phục'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Nhớ mật khẩu của bạn?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
