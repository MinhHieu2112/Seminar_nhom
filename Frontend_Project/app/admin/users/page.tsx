'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { DataTable, Column } from '@/components/shared/tables/DataTable';
import { TableSkeleton } from '@/components/shared/loaders/SkeletonLoader';
import { format } from 'date-fns';
import { User } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getUsers(100);
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const columns: Column<User>[] = [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            value === 'ADMIN'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM d, yyyy'),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="Monitor and manage all platform users"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
      />

      <div className="mt-8">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable<User>
            columns={columns}
            data={users}
            rowKey="id"
            pageSize={15}
            emptyMessage="No users found"
          />
        )}
      </div>
    </PageContainer>
  );
}
