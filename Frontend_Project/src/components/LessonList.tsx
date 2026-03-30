'use client'

import { Lesson } from '@/types'
import { Clock, Lock, CheckCircle, Video, FileText } from 'lucide-react'

interface LessonListProps {
  lessons: Lesson[]
  currentLessonId?: string
  onSelectLesson: (lessonId: string) => void
  completedLessons?: Set<string>
}

export default function LessonList({
  lessons,
  currentLessonId,
  onSelectLesson,
  completedLessons = new Set(),
}: LessonListProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-lg mb-4">Lessons</h3>
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          onClick={() => !lesson.isLocked && onSelectLesson(lesson.id)}
          disabled={lesson.isLocked}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            currentLessonId === lesson.id
              ? 'border-primary bg-blue-50'
              : 'border-border hover:border-primary'
          } ${
            lesson.isLocked
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-1">
              {lesson.isLocked ? (
                <Lock size={20} className="text-gray-400" />
              ) : completedLessons.has(lesson.id) ? (
                <CheckCircle size={20} className="text-success" />
              ) : lesson.type === 'video' ? (
                <Video size={20} className="text-primary" />
              ) : (
                <FileText size={20} className="text-primary" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{lesson.title}</span>
                {lesson.isLocked && (
                  <span className="text-xs badge bg-gray-200 text-gray-800">
                    Locked
                  </span>
                )}
                {completedLessons.has(lesson.id) && (
                  <span className="text-xs badge bg-green-100 text-green-800">
                    Completed
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary truncate">
                {lesson.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{lesson.duration} min</span>
                </div>
                <span className="badge text-xs bg-gray-200 text-gray-800">
                  {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
