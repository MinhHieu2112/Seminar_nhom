import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập vào StudyPlan</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nhập thông tin để truy cập tài khoản của bạn
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
