'use client'

import { useRouter } from 'next/navigation'
import { useLearningPaths, useEnrollInPath } from '@/lib/api/services/learning-path-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Lock, CheckCircle, PlayCircle, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-success', label: 'Completed' },
  'in-progress': { icon: PlayCircle, color: 'text-primary', label: 'In Progress' },
  available: { icon: BookOpen, color: 'text-muted-foreground', label: 'Available' },
  locked: { icon: Lock, color: 'text-muted-foreground/50', label: 'Locked' },
}

export default function LearningPathPage() {
  const router = useRouter()
  const { data: pathsData, isLoading } = useLearningPaths()
  const enrollMutation = useEnrollInPath()

  const paths = pathsData?.data || []

  const handleEnroll = async (pathId: string) => {
    try {
      await enrollMutation.mutateAsync(pathId)
      toast.success('Successfully enrolled!')
      router.push(`/learning-path/${pathId}`)
    } catch (error) {
      toast.error('Failed to enroll in learning path')
    }
  }

  const getPathStatus = (path: typeof paths[0]) => {
    if (path.progress === 100) return 'completed'
    if (path.isEnrolled && path.progress > 0) return 'in-progress'
    if (path.isEnrolled || path.progress === 0) return 'available'
    return 'locked'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Paths</h1>
        <p className="text-muted-foreground">
          Follow structured courses to build your programming skills step by step.
        </p>
      </div>

      {paths.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto size-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No learning paths available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => {
            const status = statusConfig[getPathStatus(path)]
            const StatusIcon = status.icon
            const isLocked = !path.isEnrolled && path.progress === 0

            return (
              <Card
                key={path.id}
                className={cn(
                  'transition-all',
                  isLocked && 'opacity-60',
                  !isLocked && 'hover:border-primary/50 cursor-pointer'
                )}
                onClick={() => !isLocked && router.push(`/learning-path/${path.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <StatusIcon className={cn('size-5', status.color)} />
                    </div>
                    <Badge variant="secondary" className="text-xp">
                      <Zap className="size-3 mr-1" />
                      {path.totalProblems * 10} XP
                    </Badge>
                  </div>
                  <CardTitle className="mt-3">{path.title}</CardTitle>
                  <CardDescription>{path.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">
                      {path.completedProblems} / {path.totalProblems} lessons
                    </span>
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                  <Progress value={path.progress || 0} className="h-2 mb-4" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{path.modules.length} modules</span>
                    <span>~{path.estimatedHours}h</span>
                  </div>
                  {!path.isEnrolled && (
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnroll(path.id)
                      }}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        'Enroll Now'
                      )}
                    </Button>
                  )}
                  {path.isEnrolled && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/learning-path/${path.id}`)
                      }}
                    >
                      Continue Learning
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
