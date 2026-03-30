'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { DataTable, Column } from '@/components/shared/tables/DataTable';
import { TableSkeleton } from '@/components/shared/loaders/SkeletonLoader';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  difficulty: string;
  stages_count?: number;
  status: string;
  created_at: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjects([]);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const columns: Column<Project>[] = [
    {
      key: 'title',
      label: 'Project Title',
      sortable: true,
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            value === 'EASY'
              ? 'bg-green-500/20 text-green-400'
              : value === 'MEDIUM'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'stages_count',
      label: 'Stages',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            value === 'PUBLISHED'
              ? 'bg-green-500/20 text-green-400'
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
      render: (value) => format(new Date(value), 'MMM d, yyyy'),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Management"
        description="Create and manage mini-projects"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Projects' }]}
        action={{
          label: 'Create Project',
          onClick: () => console.log('Create project'),
        }}
      />

      <div className="mt-8">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable<Project>
            columns={columns}
            data={projects}
            rowKey="id"
            pageSize={15}
            emptyMessage="No projects found. Create your first project to get started."
          />
        )}
      </div>
    </PageContainer>
  );
}
