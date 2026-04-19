import { AuthGuard } from '@/components/auth/AuthGuard';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ChangePasswordForm } from '@/components/password/ChangePasswordForm';

function ProfileContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-lg font-medium text-gray-900">
            Personal Information
          </h2>
          <ProfileForm />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-lg font-medium text-gray-900">
            Change Password
          </h2>
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
