'use client'

import { CheckCircle2, Lock, Circle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LearningPath, LearningModule } from '@/lib/api/types'

interface RoadmapProps {
  path: LearningPath
  className?: string
}

export function Roadmap({ path, className }: RoadmapProps) {
  const modules = path.modules.sort((a, b) => a.order - b.order)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Learning Roadmap</h2>
        <span className="text-sm text-muted-foreground">
          {path.completedProblems} / {path.totalProblems} completed
        </span>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

        {/* Modules */}
        <div className="flex flex-col gap-6">
          {modules.map((module, index) => {
            const isLast = index === modules.length - 1
            const isCompleted = module.isCompleted
            const isUnlocked = module.isUnlocked || index === 0
            const isCurrent = !isCompleted && isUnlocked && modules[index - 1]?.isCompleted

            return (
              <div key={module.id} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-success bg-success/10',
                    isCurrent && 'border-primary bg-primary/10 animate-pulse',
                    !isUnlocked && 'border-muted bg-muted/50',
                    isUnlocked && !isCompleted && !isCurrent && 'border-primary/30 bg-primary/5'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : isUnlocked ? (
                    <Circle className="size-5 text-primary" />
                  ) : (
                    <Lock className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div
                    className={cn(
                      'rounded-lg border p-4 transition-all',
                      isCompleted && 'border-success/50 bg-success/5',
                      isCurrent && 'border-primary/50 bg-primary/5',
                      !isUnlocked && 'border-muted bg-muted/30 opacity-60',
                      isUnlocked && !isCompleted && !isCurrent && 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{module.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            Module {module.order}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {module.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{module.problems.length} lessons</span>
                          {isCompleted && (
                            <span className="text-success">Completed</span>
                          )}
                          {isCurrent && (
                            <span className="text-primary">Current</span>
                          )}
                          {!isUnlocked && (
                            <span>Locked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {!isLast && (
                    <div className="flex items-center justify-center pt-2">
                      <ArrowRight className="size-4 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
