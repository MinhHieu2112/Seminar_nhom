'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { DataTable, Column } from '@/components/shared/tables/DataTable';
import { TableSkeleton } from '@/components/shared/loaders/SkeletonLoader';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/shared/dialogs/ConfirmDialog';
import { AlertCircle } from 'lucide-react';

interface ForumThread {
  id: string;
  title: string;
  created_by: string;
  status: string;
  flagged: boolean;
  created_at: string;
}

export default function AdminForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; threadId: string | null }>({
    isOpen: false,
    threadId: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const data = await adminService.getForumThreads(50);
        setThreads(data || []);
      } catch (error) {
        console.error('Error fetching forum threads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  const handleDeleteThread = async () => {
    if (!deleteDialog.threadId) return;

    setDeleting(true);
    try {
      await adminService.updateForumThreadStatus(deleteDialog.threadId, 'DELETED');
      setThreads(threads.filter((t) => t.id !== deleteDialog.threadId));
      setDeleteDialog({ isOpen: false, threadId: null });
    } catch (error) {
      console.error('Error deleting thread:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<ForumThread>[] = [
    {
      key: 'title',
      label: 'Thread Title',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-start gap-2">
          {row.flagged && <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
          <span className="truncate">{value}</span>
        </div>
      ),
    },
    {
      key: 'created_by',
      label: 'Author',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            value === 'ACTIVE'
              ? 'bg-green-500/20 text-green-400'
              : value === 'FLAGGED'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM d, yyyy HH:mm'),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Forum Moderation"
        description="Review and moderate forum threads"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Forum' }]}
      />

      <div className="mt-8">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable<ForumThread>
            columns={columns}
            data={threads}
            rowKey="id"
            pageSize={15}
            onRowClick={(row) => {
              console.log('Viewing thread:', row.id);
            }}
            emptyMessage="No threads found"
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Thread"
        description="Are you sure you want to delete this thread? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isLoading={deleting}
        onConfirm={handleDeleteThread}
        onCancel={() => setDeleteDialog({ isOpen: false, threadId: null })}
      />
    </PageContainer>
  );
}
