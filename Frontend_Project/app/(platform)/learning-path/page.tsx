import { Metadata } from "next"
import { BookOpen, Lock, CheckCircle, PlayCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Learning Path",
  description: "Structured courses to guide your learning journey",
}

// Mock data for demonstration
const courses = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Master the basics of JavaScript programming",
    lessons: 24,
    completedLessons: 12,
    status: "in-progress",
    xp: 500,
  },
  {
    id: 2,
    title: "Data Structures",
    description: "Learn essential data structures for coding interviews",
    lessons: 20,
    completedLessons: 8,
    status: "in-progress",
    xp: 750,
  },
  {
    id: 3,
    title: "Algorithm Patterns",
    description: "Common patterns for solving algorithm problems",
    lessons: 15,
    completedLessons: 15,
    status: "completed",
    xp: 600,
  },
  {
    id: 4,
    title: "TypeScript Essentials",
    description: "Add type safety to your JavaScript code",
    lessons: 18,
    completedLessons: 0,
    status: "locked",
    xp: 450,
  },
  {
    id: 5,
    title: "React Fundamentals",
    description: "Build modern user interfaces with React",
    lessons: 22,
    completedLessons: 0,
    status: "available",
    xp: 550,
  },
]

const statusConfig = {
  "completed": { icon: CheckCircle, color: "text-success", label: "Completed" },
  "in-progress": { icon: PlayCircle, color: "text-primary", label: "In Progress" },
  "available": { icon: BookOpen, color: "text-muted-foreground", label: "Available" },
  "locked": { icon: Lock, color: "text-muted-foreground/50", label: "Locked" },
}

export default function LearningPathPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Path</h1>
        <p className="text-muted-foreground">
          Follow structured courses to build your programming skills.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const status = statusConfig[course.status as keyof typeof statusConfig]
          const StatusIcon = status.icon
          const progress = (course.completedLessons / course.lessons) * 100
          const isLocked = course.status === "locked"

          return (
            <Card 
              key={course.id} 
              className={isLocked ? "opacity-60" : "hover:border-primary/50 transition-colors cursor-pointer"}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <StatusIcon className={`size-5 ${status.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xp">
                    +{course.xp} XP
                  </Badge>
                </div>
                <CardTitle className="mt-3">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {course.completedLessons} / {course.lessons} lessons
                  </span>
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <Progress value={progress} className="mt-3 h-2" />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
