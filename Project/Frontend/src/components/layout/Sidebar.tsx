'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Target,
  BarChart2,
  Users,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const personalItems = [
    { href: '/scheduler/schedule', label: 'Lịch của tôi', icon: Calendar },
    { href: '/scheduler/goals', label: 'Mục tiêu cá nhân', icon: Target },
    { href: '/scheduler/analytics', label: 'Phân tích', icon: BarChart2 },
  ];

  const adminItems = [
    { href: '/admin/users', label: 'Quản trị người dùng', icon: Users, roles: ['admin'] },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 overflow-y-auto border-r border-gray-200 bg-[#fbfbfa]">
      <div className="flex flex-col gap-6 p-4 h-full">
        {/* Cá nhân */}
        <div>
          <div className="group flex items-center justify-between px-2 py-1 mb-1">
            <h3 className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-default">Cá nhân</h3>
            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <nav className="space-y-0.5">
            {personalItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-200/50 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Teamwork */}
        <div>
          <div className="group flex items-center justify-between px-2 py-1 mb-1">
            <h3 className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-default">Teamwork</h3>
            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <nav className="space-y-0.5">
            <button className="w-full flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 transition-colors text-left">
              <Plus className="h-4 w-4 text-gray-400" />
              <span>Bắt đầu cộng tác</span>
            </button>
          </nav>
        </div>

        {/* Admin */}
        {isAdmin && (
          <div>
            <div className="group flex items-center justify-between px-2 py-1 mb-1">
              <h3 className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-default">Quản trị</h3>
            </div>
            <nav className="space-y-0.5">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-200/50 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

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
