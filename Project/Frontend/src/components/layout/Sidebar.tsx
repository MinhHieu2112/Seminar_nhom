'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Calendar,
  User,
  Users,
  BarChart2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/scheduler/schedule', label: 'Lịch học của tôi', icon: Calendar },
  { href: '/scheduler/goals', label: 'Mục tiêu & Nhiệm vụ', icon: Target },
  { href: '/scheduler/analytics', label: 'Phân tích', icon: BarChart2 },
  { href: '/profile', label: 'Hồ sơ', icon: User },
  { href: '/admin/users', label: 'Quản trị', icon: Users, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="flex flex-col gap-1 p-4 h-full">
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

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            © 2026 StudyPlan
          </p>
        </div>
      </div>
    </aside>
  );
}
