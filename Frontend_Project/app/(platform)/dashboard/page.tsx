"use client"

import { useEffect } from "react"
import { Trophy, Flame, Target, BookOpen, CheckCircle2, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

import { useCurrentUser } from "@/lib/api/services/user-service"
import { useRecentSubmissions } from "@/lib/api/services/submission-service"
import { useEnrolledPaths } from "@/lib/api/services/learning-path-service"
import { getUnlockHistory } from "@/lib/utils/unlock-history"

const statusMap: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  accepted: { icon: CheckCircle2, label: "Accepted", color: "text-emerald-600" },
  wrong_answer: { icon: XCircle, label: "Wrong Answer", color: "text-red-600" },
  time_limit_exceeded: { icon: Clock, label: "TLE", color: "text-amber-600" },
  runtime_error: { icon: XCircle, label: "Error", color: "text-red-600" },
  pending: { icon: Clock, label: "Pending", color: "text-slate-600" },
}

export default function DashboardPage() {
  const { data: userResp, isLoading: userLoading } = useCurrentUser()
  const { data: recentResp, isLoading: recentLoading } = useRecentSubmissions(6)
  const { data: enrolledResp, isLoading: enrolledLoading } = useEnrolledPaths()

  const user = userResp?.data
  const submissions = recentResp?.data ?? []
  const enrolled = enrolledResp?.data ?? []

  useEffect(() => {
    const history = getUnlockHistory()
    if (history.length > 0) {
      toast.success(`Unlocked ${history[0].moduleTitle} in ${history[0].courseTitle}`)
    }
  }, [])

  if (userLoading || recentLoading || enrolledLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const xpProgress = user?.xpToNextLevel ? Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100)) : 0

  const stats = [
    { title: "Level", value: user?.level ?? 0, description: `${user?.xp ?? 0}/${user?.xpToNextLevel ?? 1} XP`, icon: Trophy, progress: xpProgress, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Streak", value: user?.streak ?? 0, description: "Current streak", icon: Flame, progress: Math.min(100, (user?.streak ?? 0) * 10), color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "Solved", value: user?.totalSolved ?? 0, description: "Problems solved", icon: Target, progress: Math.min(100, ((user?.totalSolved ?? 0) / 100) * 100), color: "text-sky-500", bg: "bg-sky-500/10" },
    { title: "Courses", value: enrolled.filter((p) => p.progress >= 100).length, description: `${enrolled.length} enrolled`, icon: BookOpen, progress: enrolled.length ? Math.round((enrolled.filter((p) => p.progress >= 100).length / enrolled.length) * 100) : 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {user?.username ?? "Learner"}</h1>
        <p className="text-muted-foreground">Overview of progress and recent activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bg}`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <Progress value={stat.progress} className="h-1" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest solves and results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submissions.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : submissions.map((s) => {
                const status = statusMap[s.status] ?? statusMap.pending
                const Icon = status.icon
                return (
                  <div key={s.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{s.problemTitle}</p>
                        <p className="text-xs text-muted-foreground">{s.language} • {new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        <Icon className="size-3" />{status.label}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+{s.xpEarned} XP</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Resume your paths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enrolled.length === 0 ? <p className="text-sm text-muted-foreground">No enrolled paths yet.</p> : enrolled.slice(0, 4).map((path) => (
                <div key={path.id} className="rounded-lg border p-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{path.title}</p>
                      <p className="text-xs text-muted-foreground">{path.completedModules}/{path.totalModules ?? 0} modules</p>
                    </div>
                    <span className="text-xs font-semibold">{path.progress ?? 0}%</span>
                  </div>
                  <Progress value={path.progress ?? 0} className="mt-2 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
