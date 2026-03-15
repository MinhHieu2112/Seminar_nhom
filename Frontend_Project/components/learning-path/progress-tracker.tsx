'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, BookOpen, Clock, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LearningPath } from '@/lib/api/types'

interface ProgressTrackerProps {
  path: LearningPath
  className?: string
}

export function ProgressTracker({ path, className }: ProgressTrackerProps) {
  const progressPercentage = path.progress || 0
  const completedModules = path.modules.filter((m) => m.isCompleted).length
  const totalModules = path.modules.length
  const completedLessons = path.completedProblems
  const totalLessons = path.totalProblems

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-success'
      case 'medium':
        return 'text-warning'
      case 'hard':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-level" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-4" />
              <span>Modules</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{completedModules}</span>
              <span className="text-sm text-muted-foreground">/ {totalModules}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="size-4" />
              <span>Lessons</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{completedLessons}</span>
              <span className="text-sm text-muted-foreground">/ {totalLessons}</span>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Clock className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">Estimated Time</span>
            <p className="text-sm font-medium">
              {path.estimatedHours} hours
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs', getDifficultyColor(path.difficulty))}
          >
            {path.difficulty}
          </Badge>
        </div>

        {/* Next Module */}
        {progressPercentage < 100 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground mb-1">Next Up</p>
            <p className="text-sm font-medium">
              {path.modules.find((m) => !m.isCompleted && m.isUnlocked)?.title ||
                path.modules.find((m) => !m.isCompleted)?.title ||
                'Complete current module to unlock next'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
