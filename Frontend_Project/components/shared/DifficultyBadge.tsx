'use client'

interface DifficultyBadgeProps {
  level: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced'
}

const colors = {
  easy: 'bg-emerald-900 text-emerald-200',
  medium: 'bg-amber-900 text-amber-200',
  hard: 'bg-red-900 text-red-200',
  beginner: 'bg-emerald-900 text-emerald-200',
  intermediate: 'bg-blue-900 text-blue-200',
  advanced: 'bg-red-900 text-red-200',
}

export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded ${colors[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  )
}
