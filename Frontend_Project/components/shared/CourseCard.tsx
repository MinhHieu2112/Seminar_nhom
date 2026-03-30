'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'

interface CourseCardProps {
  id: string
  title: string
  description: string
  thumbnail?: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  progress?: number
  enrolled?: boolean
}

const difficultyColors = {
  beginner: 'bg-emerald-900 text-emerald-200',
  intermediate: 'bg-blue-900 text-blue-200',
  advanced: 'bg-red-900 text-red-200',
}

export function CourseCard({
  id,
  title,
  description,
  thumbnail,
  category,
  difficulty,
  progress,
  enrolled,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
        <div className="relative h-40 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center overflow-hidden">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-6xl opacity-20">📚</div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <span className={`text-xs px-2 py-1 rounded ${difficultyColors[difficulty]}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
            <span className="text-xs text-slate-400">{category}</span>
          </div>

          <h3 className="font-semibold text-white mb-2 line-clamp-2">{title}</h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{description}</p>

          {enrolled && progress !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-300">Progress</span>
                <span className="text-xs text-purple-400 font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded transition-colors">
            {enrolled ? 'Continue' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </Link>
  )
}
