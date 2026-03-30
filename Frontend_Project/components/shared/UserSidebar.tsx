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
    <aside className={`bg-slate-950 border-r border-slate-800 transition-all ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white transition-colors"
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
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {isOpen && <span>{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
