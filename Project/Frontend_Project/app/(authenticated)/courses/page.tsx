'use client';

import { CourseCard } from '@/components/shared/CourseCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useState } from 'react';
import { useCourses, useEnrollCourse } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CourseLevel, CourseStatusFilter, CourseFilter } from '@/types/api-types';

const FILTERS: { value: string; label: string; type: 'status' | 'difficulty' }[] = [
  { value: 'all', label: 'All', type: 'status' },
  { value: 'enrolled', label: 'Enrolled', type: 'status' },
  { value: 'BEGINNER', label: 'Beginner', type: 'difficulty' },
  { value: 'INTERMEDIATE', label: 'Intermediate', type: 'difficulty' },
  { value: 'ADVANCED', label: 'Advanced', type: 'difficulty' },
];

export default function CoursesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filter: CourseFilter = { q: undefined };
  const active = FILTERS.find(f => f.value === activeFilter);
  if (active?.type === 'status') {
    filter.status = activeFilter as CourseStatusFilter;
  } else if (active?.type === 'difficulty') {
    filter.difficulty = activeFilter as CourseLevel;
  }
  
  const { data: courses, isLoading, error } = useCourses(filter);
  const enrollMutation = useEnrollCourse();

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollMutation.mutateAsync(courseId);
      toast.success('Successfully enrolled in course!');
    } catch {
      toast.error('Failed to enroll. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="flex gap-2 mb-8">
            {FILTERS.map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon="⚠️"
            title="Error Loading Courses"
            description="Failed to load courses. Please try again later."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Courses</h1>
          <p className="text-gray-500">Explore our comprehensive course catalog</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === f.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!courses || courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No Courses Found"
            description="Try adjusting your filters or check back later"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                category={course.category}
                difficulty={course.difficulty}
                progress={course.progress}
                enrolled={course.enrolled}
                onEnroll={() => handleEnroll(course.id)}
                isEnrolling={enrollMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
