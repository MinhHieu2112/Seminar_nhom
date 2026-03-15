import { Metadata } from "next"
import { Trophy, Flame, Target, BookOpen, Code2, Gamepad2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your learning progress and statistics",
}

// Mock data for demonstration
const stats = [
  {
    title: "Current Level",
    value: "12",
    description: "2,450 / 3,000 XP to next level",
    icon: Trophy,
    color: "text-level",
    bgColor: "bg-level/10",
    progress: 82,
  },
  {
    title: "Day Streak",
    value: "7",
    description: "Keep it up! Longest: 14 days",
    icon: Flame,
    color: "text-streak",
    bgColor: "bg-streak/10",
    progress: 50,
  },
  {
    title: "Problems Solved",
    value: "47",
    description: "12 this week",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
    progress: 47,
  },
  {
    title: "Courses Completed",
    value: "3",
    description: "2 in progress",
    icon: BookOpen,
    color: "text-success",
    bgColor: "bg-success/10",
    progress: 60,
  },
]

const recentActivity = [
  { type: "problem", title: "Two Sum", difficulty: "Easy", xp: 50, time: "2h ago" },
  { type: "lesson", title: "Array Methods", course: "JavaScript Basics", xp: 25, time: "3h ago" },
  { type: "game", title: "Code Golf Challenge", score: 850, xp: 75, time: "5h ago" },
  { type: "problem", title: "Valid Parentheses", difficulty: "Medium", xp: 100, time: "1d ago" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, Alex!</h1>
        <p className="text-muted-foreground">
          {"Here's"} what{"'s"} happening with your learning journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <Progress value={stat.progress} className="mt-3 h-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {activity.type === "problem" && <Code2 className="size-5 text-primary" />}
                    {activity.type === "lesson" && <BookOpen className="size-5 text-success" />}
                    {activity.type === "game" && <Gamepad2 className="size-5 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.type === "problem" && `Difficulty: ${activity.difficulty}`}
                      {activity.type === "lesson" && activity.course}
                      {activity.type === "game" && `Score: ${activity.score}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-xp">+{activity.xp} XP</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">JavaScript Fundamentals</p>
                      <p className="text-sm text-muted-foreground">12 of 24 lessons completed</p>
                    </div>
                  </div>
                </div>
                <Progress value={50} className="mt-4 h-2" />
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                      <Code2 className="size-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Data Structures</p>
                      <p className="text-sm text-muted-foreground">8 of 20 lessons completed</p>
                    </div>
                  </div>
                </div>
                <Progress value={40} className="mt-4 h-2" />
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-level/10">
                      <Target className="size-5 text-level" />
                    </div>
                    <div>
                      <p className="font-medium">Algorithm Challenges</p>
                      <p className="text-sm text-muted-foreground">5 of 15 challenges completed</p>
                    </div>
                  </div>
                </div>
                <Progress value={33} className="mt-4 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
