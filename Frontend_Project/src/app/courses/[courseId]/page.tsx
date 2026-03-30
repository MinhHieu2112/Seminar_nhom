'use client'

import { useState, useEffect } from 'react'
import { getCourseById, getCourseLessons, markLessonComplete, getCourseProgress } from '@/lib/api'
import { Course, Lesson, CourseProgress } from '@/types'
import LessonList from '@/components/LessonList'
import { Star, Users, Clock, Loader } from 'lucide-react'

interface CourseDetailPageProps {
  params: {
    courseId: string
  }
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      setLoading(true)
      setError(null)
      try {
        const courseResponse = await getCourseById(params.courseId)
        if (courseResponse.success && courseResponse.data) {
          setCourse(courseResponse.data)
        } else {
          setError(courseResponse.error || 'Failed to load course')
          return
        }

        const lessonsResponse = await getCourseLessons(params.courseId)
        if (lessonsResponse.success && lessonsResponse.data) {
          setLessons(lessonsResponse.data)
          setSelectedLesson(lessonsResponse.data[0] || null)
        }

        const progressResponse = await getCourseProgress(params.courseId)
        if (progressResponse.success && progressResponse.data) {
          setProgress(progressResponse.data)
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadCourseData()
  }, [params.courseId])

  const completedLessons = new Set(
    progress?.lessonProgress
      ?.filter((lp) => lp.completed)
      .map((lp) => lp.lessonId) || []
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader className="animate-spin mb-4" size={40} />
        <p className="text-text-secondary">Loading course...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container-max py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-700 font-medium text-lg">{error || 'Course not found'}</p>
          <a href="/courses" className="btn-primary mt-4 inline-block">
            Back to Courses
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container-max">
        {/* Course Header */}
        <div className="mb-8">
          <a href="/courses" className="text-primary hover:text-primary-dark mb-4 inline-block">
            ← Back to Courses
          </a>
          <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
          <div className="flex flex-wrap gap-6 text-text-secondary">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-yellow-400" />
              <span>{course.rating.toFixed(1)} ({course.enrolledCount.toLocaleString()} enrolled)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>{course.totalDuration} hours • {course.totalLessons} lessons</span>
            </div>
            <span className="badge bg-blue-100 text-blue-800">{course.level}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-8 bg-white p-6 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Course Progress</h3>
              <span className="text-sm text-text-secondary">
                {Math.round(progress.progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Lessons */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white p-4 rounded-lg border border-border max-h-[calc(100vh-100px)] overflow-y-auto">
              <LessonList
                lessons={lessons}
                currentLessonId={selectedLesson?.id}
                onSelectLesson={(lessonId) => {
                  const lesson = lessons.find((l) => l.id === lessonId)
                  if (lesson) setSelectedLesson(lesson)
                }}
                completedLessons={completedLessons}
              />
            </div>
          </div>

          {/* Main Lesson Viewer */}
          <div className="lg:col-span-3">
            {selectedLesson ? (
              <LessonViewer
                lesson={selectedLesson}
                courseId={params.courseId}
                isCompleted={completedLessons.has(selectedLesson.id)}
              />
            ) : (
              <div className="text-center py-16">
                <p className="text-text-secondary">No lessons available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

interface LessonViewerProps {
  lesson: Lesson
  courseId: string
  isCompleted: boolean
}

function LessonViewer({ lesson, courseId, isCompleted }: LessonViewerProps) {
  const [loading, setLoading] = useState(false)

  const handleMarkComplete = async () => {
    setLoading(true)
    try {
      await markLessonComplete(courseId, lesson.id)
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Lesson Content Area */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {/* Content Viewer */}
        <div className="bg-gradient-to-br from-primary to-primary-dark aspect-video flex items-center justify-center">
          {lesson.type === 'video' && lesson.content.videoUrl ? (
            <video
              src={lesson.content.videoUrl}
              controls
              className="w-full h-full"
              controlsList="nodownload"
            />
          ) : lesson.type === 'document' && lesson.content.documentUrl ? (
            <iframe
              src={lesson.content.documentUrl}
              className="w-full h-full"
              title={lesson.title}
            />
          ) : (
            <div className="text-center text-white">
              <p className="text-xl font-medium">No content available</p>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{lesson.title}</h2>
          <p className="text-text-secondary mb-6">{lesson.description}</p>

          {/* Lesson Meta */}
          <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
            <div>
              <span className="text-sm text-text-secondary">Duration</span>
              <p className="font-medium">{lesson.duration} minutes</p>
            </div>
            <div>
              <span className="text-sm text-text-secondary">Type</span>
              <p className="font-medium capitalize">{lesson.type}</p>
            </div>
            {isCompleted && (
              <div>
                <span className="text-sm text-success">✓ Completed</span>
              </div>
            )}
          </div>

          {/* Mark Complete Button */}
          {!isCompleted && (
            <button
              onClick={handleMarkComplete}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Marking as complete...' : 'Mark as Complete'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button className="btn-secondary">← Previous Lesson</button>
        <button className="btn-secondary">Next Lesson →</button>
      </div>
    </div>
  )
}
