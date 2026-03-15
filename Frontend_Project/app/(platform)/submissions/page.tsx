"use client"

import { useRecentSubmissions } from "@/lib/api/services"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


const statusConfig = {
  accepted: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Accepted" },
  wrong_answer: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Wrong Answer" },
  time_limit_exceeded: { icon: Clock, color: "text-xp", bg: "bg-xp/10", label: "TLE" },
  runtime_error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Error" },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/10", label: "Pending" },
}

export default function SubmissionsPage() {
  const { data, isLoading } = useRecentSubmissions(10)
  const submissions = data?.data || []

  if (isLoading) {
    return <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">Loading submissions…</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground">
          Review your submission history and track your progress.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Your latest code submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Problem</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Language</div>
              <div className="col-span-2">Runtime</div>
              <div className="col-span-1">Memory</div>
              <div className="col-span-2 text-right">Submitted</div>
            </div>
            {submissions.map((submission) => {
              const status = statusConfig[submission.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              
              return (
                <div
                  key={submission.id}
                  className="grid grid-cols-12 gap-4 border-b p-3 text-sm last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="col-span-3 font-medium">{submission.problem}</div>
                  <div className="col-span-2">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className="size-3" />
                      {submission.status === "Time Limit Exceeded" ? "TLE" : submission.status}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="secondary">{submission.language}</Badge>
                  </div>
                  <div className="col-span-2 text-muted-foreground">{submission.runtime}</div>
                  <div className="col-span-1 text-muted-foreground">{submission.memory}</div>
                  <div className="col-span-2 text-right text-muted-foreground">{submission.time}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
