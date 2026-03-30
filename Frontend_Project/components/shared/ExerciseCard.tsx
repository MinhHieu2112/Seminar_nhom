'use client'

import Link from 'next/link'

interface ExerciseCardProps {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  acceptanceRate: number
  status?: 'not_attempted' | 'attempted' | 'accepted'
  language: string
}

const difficultyColors = {
  easy: 'bg-emerald-900 text-emerald-200',
  medium: 'bg-amber-900 text-amber-200',
  hard: 'bg-red-900 text-red-200',
}

const statusColors = {
  not_attempted: 'bg-slate-700 text-slate-200',
  attempted: 'bg-blue-900 text-blue-200',
  accepted: 'bg-emerald-900 text-emerald-200',
}

const statusLabels = {
  not_attempted: 'Not Attempted',
  attempted: 'Attempted',
  accepted: 'Accepted',
}

export function ExerciseCard({
  id,
  title,
  description,
  difficulty,
  acceptanceRate,
  status = 'not_attempted',
  language,
}: ExerciseCardProps) {
  return (
    <Link href={`/practice/${id}`}>
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded ${difficultyColors[difficulty]}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-3">
            <span className="text-slate-400">
              <span className="text-purple-400 font-medium">{acceptanceRate}%</span> Success Rate
            </span>
            <span className="text-slate-400">{language}</span>
          </div>
          <div className="text-slate-400">→</div>
        </div>
      </div>
    </Link>
  )
}
