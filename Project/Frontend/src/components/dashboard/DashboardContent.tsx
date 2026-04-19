'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

export function DashboardContent() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">StudyPlan Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Link
                href="/profile"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Profile
              </Link>
              {user?.role === 'admin' && (
                <Link
                  href="/admin/users"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Welcome back!</h2>
          <p className="mt-2 text-gray-600">
            This is your dashboard. More features coming soon.
          </p>
          <div className="mt-4 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Role:</strong> {user?.role}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Timezone:</strong> {user?.timezone}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
