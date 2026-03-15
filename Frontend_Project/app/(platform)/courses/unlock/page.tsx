'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnlockCoursesPage() {
  const router = useRouter()

  useEffect(() => {
    // Keep this dedicated route for UX clarity while still directing users to the full learning path page.
    const timer = setTimeout(() => router.replace('/learning-path'), 700)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="space-y-4 p-4 lg:p-8">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-primary">Dashboard</span>
        <span>/</span>
        <span className="text-primary">Courses</span>
        <span>/</span>
        <span className="text-primary">Unlock</span>
      </div>
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Unlock Courses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This page is your dedicated unlock hub, focused on unlocking course modules quickly.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-secondary/20 px-2 py-1 text-secondary">Tip: Earn coins by completing lessons</span>
          <span className="rounded-full bg-secondary/20 px-2 py-1 text-secondary">Use XP to unlock modules quickly</span>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Button asChild>
            <Link href="/learning-path" className="inline-flex items-center gap-2">
              Go to Learning Paths
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">or wait to auto-redirect.</span>
        </div>
      </div>
    </div>
  )
}
