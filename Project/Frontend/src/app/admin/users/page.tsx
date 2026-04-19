import { AuthGuard } from '@/components/auth/AuthGuard';
import { UsersTable } from '@/components/admin/UsersTable';

function AdminUsersContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user accounts and their status
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <UsersTable />
      </main>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAdmin>
      <AdminUsersContent />
    </AuthGuard>
  );
}
