import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';

export const metadata = {
  title: 'Đăng nhập | StudyPlan',
  description: 'Đăng nhập vào tài khoản StudyPlan của bạn để quản lý kế hoạch học tập.',
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
