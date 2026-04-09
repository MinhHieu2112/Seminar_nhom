'use client'

interface ProgressProps {
  value: number
  max?: number
  showLabel?: boolean
}

export function ProgressBar({ value, max = 100, showLabel = true }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="w-full">
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-slate-400 mt-1">{Math.round(percentage)}% complete</p>
      )}
    </div>
  )
}
