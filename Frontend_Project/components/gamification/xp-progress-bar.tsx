'use client'

import { Trophy, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface XPProgressBarProps {
  level: number
  xp: number
  xpToNextLevel: number
  className?: string
  showLevel?: boolean
  compact?: boolean
}

export function XPProgressBar({
  level,
  xp,
  xpToNextLevel,
  className,
  showLevel = true,
  compact = false,
}: XPProgressBarProps) {
  const progress = Math.min((xp / xpToNextLevel) * 100, 100)
  const remaining = xpToNextLevel - xp

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showLevel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-level/20 text-level">
              <Trophy className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Level {level}</span>
              {!compact && (
                <span className="text-xs text-muted-foreground">
                  {remaining} XP to next level
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xp">
            <Zap className="size-4" />
            <span className="text-sm font-medium">{xp.toLocaleString('en-US')}</span>
          </div>
        </div>
      )}
      <div className="relative">
        <Progress value={progress} className="h-3" />
        {!compact && (
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">XP Progress</span>
            <span className="font-medium text-xp">
              {xp.toLocaleString('en-US')} / {xpToNextLevel.toLocaleString('en-US')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
