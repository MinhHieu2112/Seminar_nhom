'use client'

import { useParams, useRouter } from 'next/navigation'
import { useLearningPath, useUnlockModule } from '@/lib/api/services/learning-path-service'
import { useCurrentUser } from '@/lib/api/services/user-service'
import { addUnlockHistory } from '@/lib/utils/unlock-history'
import { Roadmap, ProgressTracker, ModuleSection } from '@/components/learning-path'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LearningPathDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pathId = params.pathId as string

  const { data: pathData, isLoading } = useLearningPath(pathId)
  const { data: userData } = useCurrentUser()
  const unlockModule = useUnlockModule()

  const path = pathData?.data
  const currentUser = userData?.data

  const handleUnlockModule = async (moduleId: string, moduleTitle: string) => {
    if (!path) return

    try {
      await unlockModule.mutateAsync({ pathId: path.id, moduleId })
      addUnlockHistory(path.title, moduleTitle)
      toast.success(`Unlocked ${moduleTitle} in ${path.title}`)
    } catch (error) {
      toast.error('Failed to unlock module')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Learning path not found</p>
        <Button onClick={() => router.push('/learning-path')} variant="outline">
          Back to Learning Paths
        </Button>
      </div>
    )
  }

  const modules = path.modules.sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-primary">Dashboard</span>
          <span>/</span>
          <span className="text-primary">Learning Path</span>
          <span>/</span>
          <span className="text-muted-foreground">{path.title}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{path.title}</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/learning-path')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <p className="text-muted-foreground mt-1">{path.description}</p>
          </div>
        </div>
        {currentUser && (
          <div className="rounded-xl border border-slate-200 p-3 text-sm bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="font-medium">Coins: </span>
              <span className="text-primary font-semibold">{currentUser.coins}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-medium">XP:</span>
              <span className="text-xp font-semibold">{currentUser.xp}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roadmap */}
          <Roadmap path={path} />

          {/* Modules */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Modules</h2>
            {modules.map((module) => (
              <ModuleSection
                key={module.id}
                module={module}
                pathId={path.id}
                user={currentUser}
                onUnlock={handleUnlockModule}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ProgressTracker path={path} />
        </div>
      </div>
    </div>
  )
}
