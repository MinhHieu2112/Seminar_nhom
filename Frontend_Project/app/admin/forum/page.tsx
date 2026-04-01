'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { DataTable, Column } from '@/components/shared/tables/DataTable';
import { TableSkeleton } from '@/components/shared/loaders/SkeletonLoader';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/shared/dialogs/ConfirmDialog';

interface ForumThread {
  id: string;
  title: string;
  user_id: string;
  views_count?: number;
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
          <span className="truncate">{value}</span>
        </div>
      ),
    },
    {
      key: 'user_id',
      label: 'Author (user_id)',
      sortable: true,
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
