import { SignUpForm } from '@/components/auth/SignUpForm';
import { LogoHeader } from '@/components/auth/LogoHeader';

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <LogoHeader />
      <SignUpForm />
    </div>
  );
}
