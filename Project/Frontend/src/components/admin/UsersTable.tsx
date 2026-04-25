'use client';

import { useState } from 'react';
import { useAdminUsers, useToggleUser } from '@/lib/hooks/useAdmin';
import type { User } from '@/types/api';

function UserRow({ user }: { user: User }) {
  const { mutate: toggleUser, isPending } = useToggleUser();

  const handleToggle = () => {
    if (confirm(`Bạn có chắc chắn muốn ${user.isActive ? 'khóa' : 'kích hoạt'} người dùng này không?`)) {
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
          {user.isActive ? 'Hoạt động' : 'Đã khóa'}
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
              ? 'Đang cập nhật...'
              : user.isActive
              ? 'Khóa'
              : 'Kích hoạt'}
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
        Tải danh sách người dùng thất bại. Vui lòng thử lại.
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
                Vai trò
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Múi giờ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Hành động
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
                  Không tìm thấy người dùng
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
            Đang hiển thị {(page - 1) * limit + 1} đến{' '}
            {Math.min(page * limit, data?.total || 0)} trong số {data?.total} người dùng
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
