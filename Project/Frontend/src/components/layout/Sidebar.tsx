'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Calendar,
  User,
  Users,
  BookOpen,
  Clock,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scheduler/goals', label: 'Goals & Tasks', icon: Target },
  { href: '/scheduler/schedule', label: 'My Schedule', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/admin/users', label: 'Admin', icon: Users, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="flex flex-col gap-1 p-4">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200" />

        {/* Quick Stats Section */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Quick Stats
          </h4>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">0 Goals</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">0 Tasks</span>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-gray-600">0 Notifications</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <p className="text-xs text-gray-400 text-center">
            © 2026 StudyPlan
          </p>
        </div>
      </div>
    </aside>
  );
}
