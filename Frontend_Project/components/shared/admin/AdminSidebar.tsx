'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, BookOpen, Code, FolderOpen, MessageSquare, Home } from 'lucide-react';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const adminMenuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Exercises', href: '/admin/exercises', icon: Code },
  { label: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { label: 'Forum', href: '/admin/forum', icon: MessageSquare },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
        isExpanded ? 'w-56' : 'w-20'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar content */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && isExpanded && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
    </aside>
  );
}
