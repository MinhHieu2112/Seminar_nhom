'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas';
import { passwordApi } from '@/lib/api';

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
    defaultValues: {
      email: emailQuery,
    },
  });

  useEffect(() => {
    if (emailQuery) {
      setValue('email', emailQuery);
    }
  }, [emailQuery, setValue]);

  const handleVerifyOtp = async () => {
    const isEmailValid = await trigger('email');
    const isOtpValid = await trigger('otp');
    
    if (!isEmailValid || !isOtpValid) return;

    setError('');
    setIsVerifyingOtp(true);
    try {
      const email = getValues('email');
      const otp = getValues('otp');
      await passwordApi.verifyOtp({ email, otp });
      // OTP verified successfully, move to step 2
      setStep(2);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { error?: { message?: string } } };
      };

      if (axiosErr.response?.status === 400) {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
      } else {
        const message =
          axiosErr.response?.data?.error?.message ||
          'Lỗi kiểm tra OTP. Vui lòng thử lại.';
        setError(message);
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');

    try {
      await passwordApi.reset({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { error?: { message?: string } } };
      };

      if (axiosErr.response?.status === 429) {
        setError('Quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.');
      } else if (axiosErr.response?.status === 400) {
        setError('Mã OTP không hợp lệ hoặc đã hết hạn.');
        setStep(1); // Go back to step 1
      } else {
        const message =
          axiosErr.response?.data?.error?.message ||
          'Khôi phục mật khẩu thất bại. Vui lòng thử lại.';
        setError(message);
      }
    }
  };

  if (success) {
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
            <h2 className="text-xl font-semibold text-gray-900">
              Khôi phục mật khẩu thành công!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Mật khẩu của bạn đã được khôi phục. Đang chuyển hướng đến đăng nhập...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Khôi phục mật khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? 'Nhập mã OTP được gửi đến email của bạn' : 'Vui lòng thiết lập mật khẩu mới'}
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className={step === 2 ? 'hidden' : 'block'}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                readOnly={!!emailQuery}
                className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  emailQuery ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Mã OTP
              </label>
              <input
                {...register('otp')}
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
              className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifyingOtp ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </div>

          <div className={step === 1 ? 'hidden' : 'block'}>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Mật khẩu mới
              </label>
              <input
                {...register('newPassword')}
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                {...register('confirmNewPassword')}
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmNewPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-3 w-full rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Quay lại
            </button>
          </div>
        </form>

        {step === 1 && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Chưa nhận được mã?{' '}
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
              Gửi lại
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
