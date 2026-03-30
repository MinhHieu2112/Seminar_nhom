'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function UserNavbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/sign-in')
  }

  return (
    <nav className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="font-bold text-xl text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span>C</span>
            </div>
            Codex
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/courses" className="text-slate-400 hover:text-white transition-colors">
              Courses
            </Link>
            <Link href="/practice" className="text-slate-400 hover:text-white transition-colors">
              Practice
            </Link>
            <Link href="/forum" className="text-slate-400 hover:text-white transition-colors">
              Forum
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-slate-400 hover:text-white transition-colors text-sm">
              {user?.email}
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
