'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Settings } from 'lucide-react';

export function AdminNavbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/sign-in');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CX</span>
          </div>
          <span className="text-xl font-bold text-white">Codex Admin</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-slate-200 font-medium">{user?.username}</p>
              <p className="text-slate-400 text-xs">Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 border-l border-slate-700 pl-4">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
