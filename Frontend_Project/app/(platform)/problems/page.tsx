"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Filter, Check, AlertCircle, FileQuestion } from "lucide-react"
import { useProblems } from "@/lib/api/services/problem-service"
import type { Difficulty, ProblemFilters } from "@/lib/api/types"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-success/10 text-success border-success/20",
  medium: "bg-xp/10 text-xp border-xp/20",
  hard: "bg-streak/10 text-streak border-streak/20",
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

function ProblemsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Status</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="w-[100px]">Difficulty</TableHead>
          <TableHead className="w-[200px]">Tags</TableHead>
          <TableHead className="w-[100px] text-right">Solved Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="size-5 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-12" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ProblemsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Failed to load problems</EmptyTitle>
        <EmptyDescription>
          Something went wrong while fetching the problems. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onRetry}>Try again</Button>
      </EmptyContent>
    </Empty>
  )
}

function ProblemsEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyTitle>
          {hasFilters ? "No matching problems" : "No problems available"}
        </EmptyTitle>
        <EmptyDescription>
          {hasFilters
            ? "Try adjusting your search or filters to find what you're looking for."
            : "Check back later for new coding challenges."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default function ProblemsPage() {
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all")
  const [page, setPage] = useState(1)
  const limit = 20

  const filters: ProblemFilters = {
    search: search || undefined,
    difficulty: difficulty === "all" ? undefined : difficulty,
    page,
    limit,
  }

  const { data, isLoading, isError, refetch } = useProblems(filters)

  const problems = data?.data ?? []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages ?? 1
  const totalProblems = pagination?.total ?? 0

  const hasFilters = search !== "" || difficulty !== "all"

  const solvedCount = problems.filter((p) => p.isCompleted).length

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Problems</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading problems..."
                  : `${solvedCount} of ${totalProblems} solved`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search problems..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="w-full pl-9 sm:w-64"
                />
              </div>
              <Select
                value={difficulty}
                onValueChange={(value) => {
                  setDifficulty(value as Difficulty | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProblemsTableSkeleton />
          ) : isError ? (
            <ProblemsErrorState onRetry={() => refetch()} />
          ) : problems.length === 0 ? (
            <ProblemsEmptyState hasFilters={hasFilters} />
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[100px]">Difficulty</TableHead>
                      <TableHead className="w-[200px]">Tags</TableHead>
                      <TableHead className="w-[100px] text-right">Solved Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problems.map((problem) => (
                      <TableRow
                        key={problem.id}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          {problem.isCompleted ? (
                            <div className="flex size-5 items-center justify-center rounded-full bg-success/20">
                              <Check className="size-3 text-success" />
                            </div>
                          ) : (
                            <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {problem.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={difficultyColors[problem.difficulty]}
                          >
                            {difficultyLabels[problem.difficulty]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {problem.topics.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {problem.topics.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{problem.topics.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {problem.acceptanceRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, totalProblems)} of {totalProblems} problems
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
