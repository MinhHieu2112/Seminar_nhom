'use client';

import { useState } from 'react';
import { useAdminUsers, useToggleUser } from '@/lib/hooks/useAdmin';
import type { User } from '@/types/api';

function UserRow({ user }: { user: User }) {
  const { mutate: toggleUser, isPending } = useToggleUser();

  const handleToggle = () => {
    if (confirm(`Are you sure you want to ${user.isActive ? 'disable' : 'enable'} this user?`)) {
      toggleUser(user.id);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
      <td className="px-4 py-3 text-sm">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            user.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{user.timezone}</td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-sm">
        {user.role !== 'admin' && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              user.isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isPending
              ? 'Updating...'
              : user.isActive
              ? 'Disable'
              : 'Enable'}
          </button>
        )}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-14 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-4 py-3">
        <div className="h-7 w-16 animate-pulse rounded bg-gray-200" />
      </td>
    </tr>
  );
}

export function UsersTable() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useAdminUsers({ page, limit });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
        Failed to load users. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Timezone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : data?.data.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              data?.data.map((user) => <UserRow key={user.id} user={user} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, data?.total || 0)} of {data?.total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
