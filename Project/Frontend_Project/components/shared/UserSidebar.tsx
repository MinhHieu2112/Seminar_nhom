'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function UserSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/courses', label: 'Courses', icon: '📚' },
    { href: '/practice', label: 'Practice', icon: '💻' },
    { href: '/projects', label: 'Projects', icon: '🚀' },
    { href: '/learning-path', label: 'Learning Path', icon: '🎯' },
    { href: '/forum', label: 'Forum', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ]

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            {isOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {isOpen && <span className="font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
