'use client'

import { Flame, Calendar, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string
  className?: string
  compact?: boolean
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  lastActivityDate,
  className,
  compact = false,
}: StreakCounterProps) {
  const isActive = currentStreak > 0
  const daysUntilNextMilestone = getNextMilestone(currentStreak) - currentStreak

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-streak/5 via-transparent to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full',
              isActive ? 'bg-streak/20 text-streak' : 'bg-muted text-muted-foreground'
            )}
          >
            <Flame className={cn('size-5', isActive && 'animate-pulse')} />
          </div>
          <div className="flex flex-col">
            <span>Daily Streak</span>
            {!compact && (
              <CardDescription className="text-xs">
                Keep your streak alive!
              </CardDescription>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex flex-col gap-4">
          {/* Current Streak */}
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Current Streak</span>
              <span className="text-3xl font-bold text-streak">
                {currentStreak}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            {isActive && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  <span>Active</span>
                </div>
                {lastActivityDate && (
                  <span className="text-xs text-muted-foreground">
                    Last: {new Date(lastActivityDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Longest Streak */}
          {!compact && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Longest Streak</span>
              </div>
              <span className="text-lg font-semibold">{longestStreak} days</span>
            </div>
          )}

          {/* Milestone Progress */}
          {!compact && isActive && daysUntilNextMilestone > 0 && (
            <div className="rounded-lg border bg-streak/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Next milestone in
                </span>
                <span className="text-sm font-semibold text-streak">
                  {daysUntilNextMilestone} {daysUntilNextMilestone === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-streak transition-all duration-300"
                  style={{
                    width: `${(currentStreak % 7) / 7 * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Streak Status Message */}
          {!compact && (
            <div className="text-center">
              {isActive ? (
                <p className="text-sm text-muted-foreground">
                  🔥 Keep it up! You're on fire!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start a new streak today!
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


// Helper function to get next milestone (7, 14, 30, 60, 100, etc.)
function getNextMilestone(current: number): number {
  const milestones = [7, 14, 30, 60, 100, 200, 365]
  return milestones.find((m) => m > current) || milestones[milestones.length - 1]
}
