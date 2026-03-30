'use client';

import { useEffect, useState } from 'react';
import { courseService } from '@/services/courseService';
import { PageContainer } from '@/components/shared/layouts/PageContainer';
import { PageHeader } from '@/components/shared/layouts/PageHeader';
import { DataTable, Column } from '@/components/shared/tables/DataTable';
import { TableSkeleton } from '@/components/shared/loaders/SkeletonLoader';
import { format } from 'date-fns';

interface Course {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  lessons_count?: number;
  status: string;
  created_at: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCourses([]);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const columns: Column<Course>[] = [
    {
      key: 'title',
      label: 'Course Title',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
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
      key: 'lessons_count',
      label: 'Lessons',
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
        title="Course Management"
        description="Create and manage courses"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Courses' }]}
        action={{
          label: 'Create Course',
          onClick: () => console.log('Create course'),
        }}
      />

      <div className="mt-8">
        {loading ? (
          <TableSkeleton rows={10} />
        ) : (
          <DataTable<Course>
            columns={columns}
            data={courses}
            rowKey="id"
            pageSize={15}
            emptyMessage="No courses found. Create your first course to get started."
          />
        )}
      </div>
    </PageContainer>
  );
}
