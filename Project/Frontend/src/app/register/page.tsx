import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản của bạn</h1>
          <p className="mt-2 text-sm text-gray-600">
            Đăng ký để bắt đầu lên kế hoạch học tập
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
