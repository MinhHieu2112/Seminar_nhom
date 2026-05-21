'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarBlank,
  CheckSquareOffset,
  ChartPieSlice,
  Plus,
  CaretLeft,
  CaretRight,
  ShieldStar,
  UsersThree
} from '@phosphor-icons/react';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useGetGroups } from '@/hooks/useGroups';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, setCreateGroupModalOpen } = useUIStore();
  const { data: groups, isLoading: isGroupsLoading } = useGetGroups();

  const personalItems = [
    { href: '/scheduler', label: 'Lịch trình của tôi', icon: CalendarBlank, color: 'text-indigo-500', activeColor: 'bg-indigo-600' },
    { href: '/scheduler/goals', label: 'Danh sách cần làm', icon: CheckSquareOffset, color: 'text-blue-500', activeColor: 'bg-blue-600' },
    { href: '/scheduler/analytics', label: 'Báo cáo hiệu suất', icon: ChartPieSlice, color: 'text-sky-500', activeColor: 'bg-sky-600' },
  ];

  const adminItems = [
    { href: '/admin/users', label: 'Quản trị', icon: ShieldStar, color: 'text-rose-500', activeColor: 'bg-rose-600' },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-slate-200/70 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.01)] ${
        isSidebarCollapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100/80 shrink-0">
        {isSidebarCollapsed ? (
          <div 
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-650 to-blue-500 flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-500/10 cursor-pointer mx-auto hover:scale-105 transition-transform"
          >
            S
          </div>
        ) : (
          <div className="flex items-center gap-2.5 w-full justify-between pl-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-650 to-blue-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/15">
                S
              </div>
              <span className="font-bold text-slate-800 tracking-tight text-base">
                StudyPlan
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <CaretLeft weight="bold" size={16} />
            </button>
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-6 flex-1 overflow-y-auto scrollbar-hide ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
        {/* Cá nhân */}
        <div>
          {!isSidebarCollapsed && (
            <h3 className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Cá nhân
            </h3>
          )}
          <nav className="space-y-1">
            {personalItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center transition-all duration-250 group relative overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'w-12 h-12 justify-center rounded-xl mx-auto' 
                      : 'gap-3 rounded-xl px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-slate-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {isActive && !isSidebarCollapsed && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${item.activeColor}`} />
                  )}
                  {isActive && isSidebarCollapsed && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full" />
                  )}
                  <Icon
                    weight={isActive ? 'fill' : 'duotone'}
                    size={isSidebarCollapsed ? 20 : 22}
                    className={`${isActive ? item.color : 'text-slate-400'} transition-transform duration-300 group-hover:scale-108`}
                  />
                  {!isSidebarCollapsed && (
                    <span className={`text-sm transition-colors ${isActive ? 'text-slate-850 font-semibold' : 'text-slate-600 font-medium group-hover:text-slate-800'}`}>
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
            <h3 className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Không gian làm việc
            </h3>
          )}
          <nav className="space-y-1">
            {!isGroupsLoading && groups?.map((group) => {
              const isActive = pathname === `/scheduler/teamwork/${group.id}`;
              return (
                <Link
                  key={group.id}
                  href={`/scheduler/teamwork/${group.id}`}
                  className={`flex items-center transition-all duration-250 group relative overflow-hidden ${
                    isSidebarCollapsed 
                      ? 'w-12 h-12 justify-center rounded-xl mx-auto' 
                      : 'gap-3 rounded-xl px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-slate-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {isActive && !isSidebarCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                  )}
                  {isActive && isSidebarCollapsed && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full" />
                  )}
                  <UsersThree
                    weight={isActive ? 'fill' : 'duotone'}
                    size={isSidebarCollapsed ? 20 : 22}
                    className={`${isActive ? 'text-emerald-500' : 'text-slate-400'} transition-transform duration-300 group-hover:scale-108`}
                  />
                  {!isSidebarCollapsed && (
                    <span className={`text-sm truncate transition-colors ${isActive ? 'text-slate-850 font-semibold' : 'text-slate-600 font-medium group-hover:text-slate-800'}`}>
                      {group.name}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              onClick={() => setCreateGroupModalOpen(true)}
              className={`flex items-center transition-all duration-200 group hover:bg-slate-50 ${
                isSidebarCollapsed 
                  ? 'w-12 h-12 justify-center rounded-xl mx-auto' 
                  : 'w-full gap-3 rounded-xl px-3 py-2.5'
              }`}
            >
              <div className="flex items-center justify-center w-[22px] h-[22px] rounded-md border border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-colors">
                <Plus weight="bold" size={12} className="text-slate-400 group-hover:text-indigo-500" />
              </div>
              {!isSidebarCollapsed && (
                <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">
                  Tạo nhóm mới
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            {!isSidebarCollapsed && (
              <h3 className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Hệ thống
              </h3>
            )}
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center transition-all duration-250 group relative overflow-hidden ${
                      isSidebarCollapsed 
                        ? 'w-12 h-12 justify-center rounded-xl mx-auto' 
                        : 'gap-3 rounded-xl px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-slate-50/80'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {isActive && !isSidebarCollapsed && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${item.activeColor}`} />
                    )}
                    {isActive && isSidebarCollapsed && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full" />
                    )}
                    <Icon
                      weight={isActive ? 'fill' : 'duotone'}
                      size={isSidebarCollapsed ? 20 : 22}
                      className={`${isActive ? item.color : 'text-slate-400'} transition-transform duration-300 group-hover:scale-108`}
                    />
                    {!isSidebarCollapsed && (
                      <span className={`text-sm transition-colors ${isActive ? 'text-slate-850 font-semibold' : 'text-slate-600 font-medium group-hover:text-slate-800'}`}>
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

      {/* Footer User Profile */}
      <div className="p-3 mt-auto border-t border-slate-100/80 shrink-0">
        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center border border-indigo-200/50 shadow-sm shrink-0">
            <span className="text-xs font-bold text-indigo-600">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-slate-700 truncate">
                {user?.name || 'Người dùng'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.email || 'Thành viên StudyPlan'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
