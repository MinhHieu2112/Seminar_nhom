'use client'

import Link from 'next/link'
import { Course } from '@/types'
import { Star, Users, Clock } from 'lucide-react'

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="card overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-gradient-to-r from-primary to-primary-dark overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-primary">{course.category}</span>
            <span className="badge text-xs bg-gray-200 text-gray-800">
              {course.level}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold mb-2 line-clamp-2 text-text-primary">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            {course.instructor.avatar && (
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-text-secondary">{course.instructor.name}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-400" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{course.enrolledCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{course.totalDuration}h</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto">
            {course.isPaid ? (
              <span className="text-xl font-bold text-primary">${course.price}</span>
            ) : (
              <span className="text-success font-bold">Free</span>
            )}
            <button className="btn-primary text-sm py-1 px-3">
              View Course
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
