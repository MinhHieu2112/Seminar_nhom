import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthLayout } from '@/components/auth/AuthLayout';

export const metadata = {
  title: 'Đăng ký | StudyPlan',
  description: 'Tạo tài khoản StudyPlan miễn phí và bắt đầu lên kế hoạch học tập thông minh.',
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
