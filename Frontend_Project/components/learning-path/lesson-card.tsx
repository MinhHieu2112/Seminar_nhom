'use client'

import { CheckCircle2, Lock, PlayCircle, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Problem } from '@/lib/api/types'
import Link from 'next/link'

interface LessonCardProps {
  lesson: Problem
  moduleId: string
  pathId: string
  isCompleted: boolean
  isUnlocked: boolean
  order: number
  onUnlock?: () => void
  onStart?: () => void
}

export function LessonCard({
  lesson,
  moduleId,
  pathId,
  isCompleted,
  isUnlocked,
  order,
  onUnlock,
  onStart,
}: LessonCardProps) {
  const difficultyColors = {
    easy: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    hard: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  const handleClick = () => {
    if (!isUnlocked) {
      onUnlock?.()
      return
    }
    onStart?.()
  }

  return (
    <Card
      className={cn(
        'transition-all',
        isCompleted && 'border-success/50 bg-success/5',
        !isUnlocked && 'opacity-60 cursor-not-allowed',
        isUnlocked && !isCompleted && 'hover:border-primary/50 cursor-pointer'
      )}
      onClick={isUnlocked ? handleClick : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full border-2',
                isCompleted && 'border-success bg-success/10',
                !isUnlocked && 'border-muted bg-muted/50',
                isUnlocked && !isCompleted && 'border-primary/30 bg-primary/5'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : isUnlocked ? (
                <PlayCircle className="size-5 text-primary" />
              ) : (
                <Lock className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">
                Lesson {order}: {lesson.title}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs', difficultyColors[lesson.difficulty])}
                >
                  {lesson.difficulty}
                </Badge>
                {lesson.xpReward > 0 && (
                  <div className="flex items-center gap-1 text-xs text-xp">
                    <Zap className="size-3" />
                    <span>+{lesson.xpReward} XP</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {isCompleted && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {lesson.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>~{Math.ceil(lesson.description.length / 100)} min</span>
            </div>
            {lesson.topics && lesson.topics.length > 0 && (
              <div className="flex items-center gap-1">
                <span>{lesson.topics.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
          {isUnlocked && (
            <Link href={`/problems/${lesson.id}`}>
              <Button size="sm" variant={isCompleted ? 'outline' : 'default'}>
                {isCompleted ? 'Review' : 'Start'}
              </Button>
            </Link>
          )}
          {!isUnlocked && (
            <Button size="sm" variant="outline" disabled>
              Locked
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
