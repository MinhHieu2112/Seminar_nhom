'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, User } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Use store directly without destructuring to avoid hydration issues
  const store = useAuthStore();
  const user = store.user;
  const logout = store.logout;
  const isAuthenticated = store.isAuthenticated;

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/dashboard' 
                    ? 'text-primary-dark bg-primary-light/30' 
                    : 'text-gray-600 hover:bg-primary-light/20 hover:text-primary-dark'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Tổng quan
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/profile' 
                    ? 'text-primary-dark bg-primary-light/30' 
                    : 'text-gray-600 hover:bg-primary-light/20 hover:text-primary-dark'
                }`}
              >
                <User className="h-4 w-4" />
                Hồ sơ
              </Link>
            </nav>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-light to-blue-100 flex items-center justify-center text-primary-dark font-semibold text-sm">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-md bg-primary-main px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark shadow-sm"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
