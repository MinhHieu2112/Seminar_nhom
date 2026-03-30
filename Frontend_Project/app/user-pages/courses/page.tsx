'use client'

import { CourseCard } from '@/components/shared/CourseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'beginner' | 'intermediate' | 'advanced'>('all')

  useEffect(() => {
    fetchCourses()
  }, [filter])

  async function fetchCourses() {
    try {
      setLoading(true)
      let query = supabase.from('courses').select('*')

      if (filter === 'enrolled') {
        query = query.eq('status', 'enrolled')
      } else if (filter !== 'all') {
        query = query.eq('difficulty', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Courses</h1>
          <p className="text-slate-400">Explore our comprehensive course catalog</p>
        </div>

        <div className="flex gap-2 mb-8">
          {(['all', 'enrolled', 'beginner', 'intermediate', 'advanced'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : courses.length === 0 ? (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
