import { SignInForm } from '@/components/auth/SignInForm';
import { LogoHeader } from '@/components/auth/LogoHeader';

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <LogoHeader />
      <SignInForm />
    </div>
  );
}
