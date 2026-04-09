'use client';

import { useEffect, useState } from 'react';
import { exerciseService } from '@/services/exerciseService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { DataTable, Column } from '@/components/shared/tables/DataTable';
import { TableSkeleton } from '@/components/shared/loaders/SkeletonLoader';
import { format } from 'date-fns';

interface Exercise {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  test_cases_count?: number;
  accepted_rate?: number;
  status: string;
  created_at: string;
}

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setExercises([]);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const columns: Column<Exercise>[] = [
    {
      key: 'title',
      label: 'Exercise Title',
      sortable: true,
    },
    {
      key: 'language',
      label: 'Language',
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
      key: 'test_cases_count',
      label: 'Test Cases',
    },
    {
      key: 'accepted_rate',
      label: 'Acceptance Rate',
      render: (value) => `${value || 0}%`,
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
        title="Exercise Management"
        description="Create and manage coding exercises"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Exercises' }]}
        action={{
          label: 'Create Exercise',
          onClick: () => console.log('Create exercise'),
        }}
      />

      <div className="mt-8">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable<Exercise>
            columns={columns}
            data={exercises}
            rowKey="id"
            pageSize={15}
            emptyMessage="No exercises found. Create your first exercise to get started."
          />
        )}
      </div>
    </PageContainer>
  );
}
