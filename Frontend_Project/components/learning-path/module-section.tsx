'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LessonCard } from './lesson-card'
import type { LearningModule, User } from '@/lib/api/types'

interface ModuleSectionProps {
  module: LearningModule
  pathId: string
  user?: User
  onUnlock?: (moduleId: string, moduleTitle: string) => void
}

export function ModuleSection({ module, pathId, user, onUnlock }: ModuleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(module.isUnlocked && !module.isCompleted)

  const unlockCost = module.unlockCost ?? Math.max(20, module.order * 15)
  const unlockXpRequirement = module.unlockXpRequirement ?? Math.max(50, module.order * 30)
  const hasEnoughCoins = user ? user.coins >= unlockCost : true
  const hasEnoughXp = user ? user.xp >= unlockXpRequirement : true

  const completedLessons = module.problems.filter((p) => p.isCompleted).length
  const totalLessons = module.problems.length
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  const handleUnlock = () => {
    if (!module.isUnlocked && onUnlock) {
      if (!hasEnoughCoins || !hasEnoughXp) {
        toast.error(
          `Can't unlock yet. You need ${unlockCost} coins and ${unlockXpRequirement} XP.`
        )
        return
      }
      onUnlock(module.id, module.title)
    }
  }

  return (
    <Card className={cn('transition-all', !module.isUnlocked && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full border-2',
                  module.isCompleted && 'border-success bg-success/10',
                  !module.isUnlocked && 'border-muted bg-muted/50',
                  module.isUnlocked && !module.isCompleted && 'border-primary/30 bg-primary/5'
                )}
              >
                {module.isCompleted ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : module.isUnlocked ? (
                  <span className="text-sm font-semibold text-primary">{module.order}</span>
                ) : (
                  <Lock className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {module.isCompleted && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Completed
                </Badge>
              )}
              {!module.isUnlocked && (
                <Badge variant="secondary" className="text-xs">
                  Unlock: {unlockCost} coins, {unlockXpRequirement} XP
                </Badge>
              )}
              {!module.isUnlocked && (!hasEnoughCoins || !hasEnoughXp) && (
                <Badge variant="destructive" className="text-xs">
                  Insufficient rewards
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!module.isUnlocked && (
                <Button size="sm" variant="outline" onClick={handleUnlock}>
                  {hasEnoughCoins && hasEnoughXp ? 'Unlock Module' : 'Cannot Unlock'}
                </Button>
              )}
              {module.isUnlocked && module.problems.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
        {module.isUnlocked && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {completedLessons} / {totalLessons} lessons completed
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      {isExpanded && module.isUnlocked && (
        <CardContent>
          <div className="space-y-3">
            {module.problems.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                moduleId={module.id}
                pathId={pathId}
                isCompleted={lesson.isCompleted || false}
                isUnlocked={module.isUnlocked}
                order={index + 1}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
