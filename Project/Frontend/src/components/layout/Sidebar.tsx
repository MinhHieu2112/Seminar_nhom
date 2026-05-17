'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Target,
  ChartBar,
  Plus,
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  Users,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useGetGroups } from '@/hooks/useGroups';
import { CreateGroupModal } from '@/components/teamwork/CreateGroupModal';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, setCreateGroupModalOpen } = useUIStore();
  const { data: groups, isLoading: isGroupsLoading } = useGetGroups();

  const personalItems = [
    { href: '/scheduler', label: 'Lịch của tôi', icon: Calendar, color: 'text-blue-500' },
    { href: '/scheduler/goals', label: 'Task', icon: Target, color: 'text-blue-400' },
    { href: '/scheduler/analytics', label: 'Phân tích', icon: ChartBar, color: 'text-gray-400' },
  ];

  const adminItems = [
    { href: '/admin/users', label: 'Quản trị người dùng', icon: DotsThreeVertical, roles: ['admin'] },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-gray-100 bg-[#fbfbfa] flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Toggle Button */}
      <div className={`p-6 flex items-center justify-between`}>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2 font-black text-indigo-900 tracking-tighter text-xl">
            StudyPlan
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors mx-auto"
        >
          {isSidebarCollapsed ? <CaretRight weight="bold" size={20} /> : <CaretLeft weight="bold" size={20} />}
        </button>
      </div>

      <div className="flex flex-col gap-8 p-4 flex-1 overflow-y-auto">
        {/* Cá nhân */}
        <div>
          {!isSidebarCollapsed && (
            <h3 className="px-4 py-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Cá nhân</h3>
          )}
          <nav className="space-y-1 mt-2">
            {personalItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 group ${isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    weight={isActive ? "fill" : "bold"}
                    size={22}
                    className={`${isActive ? 'text-blue-500' : item.color} transition-transform group-hover:scale-110`}
                  />
                  {!isSidebarCollapsed && (
                    <span className={`text-[15px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Teamwork */}
        <div>
          {!isSidebarCollapsed && (
            <h3 className="px-4 py-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Teamwork</h3>
          )}
          <nav className="space-y-1 mt-2">
            {!isGroupsLoading && groups?.map((group) => {
              const isActive = pathname === `/scheduler/teamwork/${group.id}`;
              return (
                <Link
                  key={group.id}
                  href={`/scheduler/teamwork/${group.id}`}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 group ${isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Users
                    weight={isActive ? "fill" : "bold"}
                    size={22}
                    className={`${isActive ? 'text-blue-500' : 'text-green-500'} transition-transform group-hover:scale-110`}
                  />
                  {!isSidebarCollapsed && (
                    <span className={`text-[15px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-600'} truncate`}>
                      {group.name}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              onClick={() => setCreateGroupModalOpen(true)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-600 hover:bg-gray-50 transition-all group ${isSidebarCollapsed ? 'justify-center px-0' : ''
                }`}
            >
              <Plus weight="bold" size={22} className="text-gray-400 group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && (
                <span className="text-[15px] font-bold text-slate-500">Bắt đầu cộng tác</span>
              )}
            </button>
          </nav>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            {!isSidebarCollapsed && (
              <h3 className="px-4 py-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Quản trị</h3>
            )}
            <nav className="space-y-1 mt-2">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${isActive
                      ? 'bg-purple-50 text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                      } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon weight={isActive ? "fill" : "bold"} size={22} className={isActive ? 'text-purple-500' : 'text-gray-400'} />
                    {!isSidebarCollapsed && (
                      <span className={`text-[15px] font-bold ${isActive ? 'text-purple-600' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-6 mt-auto flex flex-col items-center gap-4 ${isSidebarCollapsed ? 'px-0' : ''}`}>
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
          N
        </div>
        {!isSidebarCollapsed && (
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            © 2026 StudyPlan
          </p>
        )}
      </div>

    </aside>
  );
}
