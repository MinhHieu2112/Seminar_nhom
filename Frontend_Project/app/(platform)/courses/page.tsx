'use client'

import { useRouter } from 'next/navigation'
import { useLearningPaths } from '@/lib/api/services/learning-path-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CoursesPage() {
  const router = useRouter()
  const { data, isLoading, error } = useLearningPaths()

  if (isLoading) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (error) {
    toast.error('Không thể tải khóa học. Vui lòng thử lại.')
    return <div className="text-red-500">Có lỗi. Vui lòng thử lại.</div>
  }

  const paths = data?.data || []

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-primary">Dashboard</span>
          <span>/</span>
          <span className="text-primary">Courses</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Courses and Learning Paths</p>
        <h1 className="text-3xl font-bold tracking-tight">Khóa học của bạn</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Quản lý khoá học, xem lộ trình và mở khóa bằng điểm XP/coin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paths.slice(0, 3).map((path) => (
          <Card key={path.id} className="border">
            <CardHeader>
              <CardTitle>{path.title}</CardTitle>
              <CardDescription>{path.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Modules: {path.modules.length}</span>
                <span>Progress: {path.progress ?? 0}%</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/learning-path/${path.id}`)}
              >
                Mở khóa chi tiết
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.push('/courses/unlock')}>Mở khóa khóa học</Button>
        <Button variant="secondary" onClick={() => router.push('/learning-path')}>
          Xem lộ trình đầy đủ
        </Button>
      </div>
    </div>
  )
}
