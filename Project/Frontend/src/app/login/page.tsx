import { AuthSlidingForm } from '@/components/auth/AuthSlidingForm';

export const metadata = {
  title: 'Đăng nhập | StudyPlan',
  description: 'Đăng nhập vào tài khoản StudyPlan của bạn để quản lý kế hoạch học tập.',
};

export default function LoginPage() {
  return (
    <AuthSlidingForm initialMode="login" />
  );
}
