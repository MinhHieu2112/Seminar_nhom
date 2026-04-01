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
    router.push('/auth/sign-in')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="font-bold text-xl text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <span>C</span>
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Codex</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Dashboard
            </Link>
            <Link href="/courses" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Courses
            </Link>
            <Link href="/practice" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Practice
            </Link>
            <Link href="/forum" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
              Forum
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
              {user?.email}
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
