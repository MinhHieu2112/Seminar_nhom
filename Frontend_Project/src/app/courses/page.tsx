'use client'

import { useState, useEffect } from 'react'
import { getCourses, getCategories } from '@/lib/api'
import { Course, CourseFilters } from '@/types'
import CourseCard from '@/components/CourseCard'
import CourseFilterBar from '@/components/CourseFilterBar'
import { Loader } from 'lucide-react'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CourseFilters>({})

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const response = await getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      }
    }
    loadCategories()
  }, [])

  // Fetch courses when filters change
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getCourses(filters)
        if (response.success && response.data) {
          setCourses(response.data.data)
        } else {
          setError(response.error || 'Failed to load courses')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [filters])

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container-max">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Explore Courses</h1>
          <p className="text-text-secondary text-lg">
            Choose from our extensive collection of programming courses
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CourseFilterBar
                categories={categories}
                onFiltersChange={setFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="animate-spin mb-4" size={40} />
                <p className="text-text-secondary">Loading courses...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                  onClick={() => setFilters({})}
                  className="btn-primary mt-4 text-sm"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-16">
                <p className="text-text-secondary text-lg mb-4">
                  No courses found matching your criteria
                </p>
                <button
                  onClick={() => setFilters({})}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Courses Grid */}
            {!loading && !error && courses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
