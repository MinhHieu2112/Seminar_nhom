import { Metadata } from "next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Problems",
  description: "Browse and solve coding problems",
}

// Mock data for demonstration
const problems = [
  { id: 1, title: "Two Sum", difficulty: "Easy", category: "Arrays", acceptance: "49.2%", solved: true },
  { id: 2, title: "Valid Parentheses", difficulty: "Easy", category: "Stack", acceptance: "40.1%", solved: true },
  { id: 3, title: "Merge Two Sorted Lists", difficulty: "Easy", category: "Linked List", acceptance: "61.8%", solved: false },
  { id: 4, title: "Maximum Subarray", difficulty: "Medium", category: "Dynamic Programming", acceptance: "50.0%", solved: false },
  { id: 5, title: "Binary Tree Inorder Traversal", difficulty: "Easy", category: "Trees", acceptance: "73.5%", solved: true },
  { id: 6, title: "Climbing Stairs", difficulty: "Easy", category: "Dynamic Programming", acceptance: "51.9%", solved: false },
  { id: 7, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", category: "Arrays", acceptance: "54.2%", solved: true },
  { id: 8, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "Sliding Window", acceptance: "34.1%", solved: false },
]

const difficultyColors = {
  Easy: "bg-success/10 text-success border-success/20",
  Medium: "bg-xp/10 text-xp border-xp/20",
  Hard: "bg-streak/10 text-streak border-streak/20",
}

export default function ProblemsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Problems</h1>
        <p className="text-muted-foreground">
          Browse and solve coding challenges to improve your skills.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Problems</CardTitle>
          <CardDescription>
            {problems.filter(p => p.solved).length} of {problems.length} solved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-1">Status</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Acceptance</div>
            </div>
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="grid grid-cols-12 gap-4 border-b p-3 text-sm last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="col-span-1">
                  {problem.solved ? (
                    <div className="size-5 rounded-full bg-success/20 flex items-center justify-center">
                      <div className="size-2 rounded-full bg-success" />
                    </div>
                  ) : (
                    <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <div className="col-span-5 font-medium">{problem.title}</div>
                <div className="col-span-2">
                  <Badge 
                    variant="outline" 
                    className={difficultyColors[problem.difficulty as keyof typeof difficultyColors]}
                  >
                    {problem.difficulty}
                  </Badge>
                </div>
                <div className="col-span-2 text-muted-foreground">{problem.category}</div>
                <div className="col-span-2 text-right text-muted-foreground">{problem.acceptance}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
