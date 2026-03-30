import { LearningProfileForm } from '@/components/auth/LearningProfileForm';
import { LogoHeader } from '@/components/auth/LogoHeader';

export default function SetupLearningProfilePage() {
  return (
    <div className="space-y-6">
      <LogoHeader />
      <LearningProfileForm />
    </div>
  );
}
