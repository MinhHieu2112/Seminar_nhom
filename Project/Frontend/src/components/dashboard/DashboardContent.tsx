'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  CheckSquare,
  Clock,
  Play,
  CaretLeft,
  CaretRight,
  BookOpenText,
  ListChecks,
  Calendar,
  Users,
  Timer,
  Warning,
  ChatCircleDots,
} from '@phosphor-icons/react';
import { addDays, startOfDay, endOfDay, isSameDay, format, addMonths, subMonths, parseISO, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSchedulerTasks, useSchedulerAllocations } from '@/hooks/useScheduler';
import type { Task, Allocation, AnalyticsDashboard } from '@/types/api';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';

const CircularProgress = ({ percent, colorClass, size = 64, stroke = 6 }: { percent: number, colorClass: string, size?: number, stroke?: number }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="transparent" className="text-gray-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className={`transition-all duration-1000 ease-out ${colorClass}`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-700">
        {percent}%
      </div>
    </div>
  );
};

export function DashboardContent() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [planTab, setPlanTab] = useState<'active' | 'history'>('active');

  const { data: analyticsData } = useAnalyticsDashboard();
  const analytics: AnalyticsDashboard = analyticsData || {
    completionRate: 0,
    productivityScore: 0,
    timeDistribution: { morning: 0, afternoon: 0, evening: 0 },
    timeBreakdown: [],
    suggestions: [],
    summary: { 
      totalGoals: 0, activeGoals: 0, completedGoals: 0, 
      individualTasks: { total: 0, completed: 0, pending: 0, overdue: 0 },
      plannedBlocks: 0, completedBlocks: 0, totalStudyMins: 0 
    },
    weeklyOverview: { scheduledBlocks: 0, studyHours: 0, completedTasks: 0 },
    nextDeadline: undefined,
  };

  const { data: tasks = [] } = useSchedulerTasks();
  const today = useMemo(() => new Date(), []);
  
  const { data: allocations = [] } = useSchedulerAllocations(
    startOfDay(today).toISOString(),
    endOfDay(addDays(today, 14)).toISOString()
  );

  const filteredTasks = useMemo(() => {
    if (planTab === 'active') {
      return tasks.filter(t => t.status !== 'done').slice(0, 5);
    }
    return tasks.filter(t => t.status === 'done').slice(0, 5);
  }, [tasks, planTab]);

  const upcomingEvents = useMemo(() => {
    const events = [
      ...allocations.map((a: Allocation) => ({
        id: a.id,
        title: a.task?.title || 'Không rõ tiêu đề',
        startTime: a.startTime,
        type: 'allocation' as const,
        due: false
      })),
      ...tasks.filter(t => t.dueTime && t.status !== 'done').map(t => ({
        id: `task-${t.id}`,
        title: t.title,
        startTime: t.dueTime!,
        type: 'task' as const,
        due: true
      }))
    ];

    const threeDaysLater = addDays(today, 3);
    return events
      .filter(e => {
        const d = parseISO(e.startTime);
        return d >= startOfDay(today) && d <= endOfDay(threeDaysLater);
      })
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())
      .slice(0, 5);
  }, [allocations, tasks, today]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const currentMonthName = format(calendarDate, 'MMMM yyyy', { locale: vi });
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blankDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDates = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  const calendarBlanks = Array.from({ length: blankDays }, (_, i) => i);
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const hasDeadline = (date: Date) => {
    return tasks.some(t => t.dueTime && isSameDay(parseISO(t.dueTime), date));
  };

  const nextMonth = () => setCalendarDate(addMonths(calendarDate, 1));
  const prevMonth = () => setCalendarDate(subMonths(calendarDate, 1));

  const glassCardClass = "bg-white/90 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/50";
  const softShadowClass = "shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300";

  const primaryGoal = tasks.find(t => t.status !== 'done') || null;

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-12 animate-in fade-in duration-700">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-8">

        {/* Active Task Banner */}
        <div className={`${glassCardClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative group`}>
          <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-200 group-hover:scale-105 transition-transform">
              <Target weight="duotone" size={32} />
            </div>
            <div className="flex-1">
              <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Mục tiêu hiện tại</div>
              <h2 className="text-gray-900 font-black text-xl leading-tight truncate max-w-[200px] sm:max-w-[400px]">
                {primaryGoal ? primaryGoal.title : 'Chưa có mục tiêu hoạt động'}
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 w-48 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: primaryGoal ? '45%' : '0%' }}></div>
                </div>
                <span className="text-[10px] font-bold text-gray-400">45%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end relative z-10">
            <div className="flex gap-5 text-xs font-bold text-gray-500">
              <div className="flex items-center gap-2"><ListChecks weight="bold" size={20} className="text-pink-400" /> {analytics.summary.activeGoals} Đang làm</div>
              <div className="flex items-center gap-2"><Clock weight="bold" size={20} className="text-green-400" /> {analytics.summary.individualTasks.total} Tổng số</div>
            </div>
            <Link href="/scheduler" className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-[11px] whitespace-nowrap shadow-lg shadow-indigo-100">
              <Play weight="fill" size={14} /> TIẾP TỤC
            </Link>
          </div>
        </div>

        {/* Status Cards - SPLIT INDIVIDUAL VS TEAMWORK */}
        <div>
          <h3 className="font-black text-gray-900 text-xl mb-6 ml-2">Trạng thái tổng quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

            {/* Card 1: Tiến độ cá nhân */}
            <div className={`bg-[#fffaf0]/80 rounded-3xl p-6 flex flex-col justify-between border border-orange-100/50 ${softShadowClass}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="bg-orange-500/10 p-2.5 rounded-2xl inline-flex text-orange-600 mb-4">
                    <Timer weight="bold" size={24} />
                  </div>
                  <div className="text-xl font-black text-gray-900 tracking-tight leading-tight">Cá nhân</div>
                  <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Tiến độ riêng</p>
                </div>
                <CircularProgress 
                  percent={analytics.summary.individualTasks.total > 0 ? Math.round((analytics.summary.individualTasks.completed / analytics.summary.individualTasks.total) * 100) : 0} 
                  colorClass="text-orange-500" 
                />
              </div>
              <div className="mt-auto">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-emerald-600 uppercase">Xong</span>
                    <span className="text-slate-700">{analytics.summary.individualTasks.completed}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-amber-500 uppercase">Chưa xong</span>
                    <span className="text-slate-700">{analytics.summary.individualTasks.pending}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-rose-500 uppercase tracking-tighter">Quá hạn</span>
                    <span className="text-rose-600">{analytics.summary.individualTasks.overdue}</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
        </div>

        {/* My Plans List */}
        <div className={glassCardClass}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-gray-900 text-xl">Kế hoạch của tôi</h3>
            <div className="flex gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50">
              <button 
                onClick={() => setPlanTab('active')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${planTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Đang học
              </button>
              <button 
                onClick={() => setPlanTab('history')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${planTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Lịch sử
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1.5fr_2fr_1fr] text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4">
            <div>Nội dung</div>
            <div>Tiến độ</div>
            <div className="text-right">Chi tiết</div>
          </div>

          <div className="space-y-2">
            {filteredTasks.map((task: Task, index: number) => {
              const colors = [
                { bg: 'bg-indigo-50', text: 'text-indigo-600', bar: 'bg-indigo-500' },
                { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
                { bg: 'bg-pink-50', text: 'text-pink-600', bar: 'bg-pink-500' },
                { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' }
              ];
              const theme = colors[index % colors.length];

              return (
                <div className="grid grid-cols-[1.5fr_2fr_1fr] items-center gap-6 p-4 rounded-3xl hover:bg-gray-50 transition-all group" key={task.id}>
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.bg} ${theme.text} group-hover:scale-110 transition-transform`}>
                      <BookOpenText weight="bold" size={22} />
                    </div>
                    <div className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{task.title}</div>
                  </div>

                  <div className="w-full flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${theme.bar} rounded-full`} style={{ width: task.status === 'done' ? '100%' : '40%' }}></div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400">{task.status === 'done' ? '100%' : '40%'}</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 text-[10px] font-black text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={16} weight="bold" /> 2h</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${task.status === 'done' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  </div>
                </div>
              )
            })}

            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <ListChecks size={40} weight="thin" />
                <p className="text-xs font-bold mt-4">Không có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="lg:col-span-1 space-y-8">
        
        {/* Calendar Widget */}
        <div className={glassCardClass}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-gray-900 text-xl">Lịch trình</h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="text-gray-400 hover:text-indigo-600 transition p-2 hover:bg-indigo-50 rounded-xl"><CaretLeft weight="bold" size={18} /></button>
              <button onClick={nextMonth} className="text-gray-400 hover:text-indigo-600 transition p-2 hover:bg-indigo-50 rounded-xl"><CaretRight weight="bold" size={18} /></button>
            </div>
          </div>

          <div className="text-[10px] font-black text-indigo-600 text-center mb-6 uppercase flex justify-center tracking-widest bg-indigo-50 py-2 rounded-xl">
            {currentMonthName}
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center">
            {dayNames.map(d => <div key={d} className="text-[10px] font-black text-gray-300 uppercase">{d}</div>)}

            {calendarBlanks.map(blank => <div key={`blank-${blank}`}></div>)}

            {calendarDates.map(date => {
              const dateVal = date.getDate();
              const isToday = isSameDay(date, today);
              const deadline = hasDeadline(date);

              return (
                <div 
                  key={dateVal} 
                  className={`relative w-9 h-9 mx-auto flex items-center justify-center rounded-2xl text-[13px] font-black transition-all cursor-pointer group
                    ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  {dateVal}
                  {deadline && !isToday && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className={glassCardClass}>
          <div className="flex items-center justify-between mb-7">
            <h3 className="font-black text-gray-900 text-xl">Sắp diễn ra</h3>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">3 NGÀY TỚI</span>
          </div>

          <div className="space-y-1">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300 text-center">
                <Calendar size={32} weight="thin" />
                <p className="text-[10px] font-bold mt-2">Trống</p>
              </div>
            ) : (
              upcomingEvents.map((event) => {
                const eventDate = parseISO(event.startTime);
                const isTodayEvent = isSameDay(eventDate, today);
                const day = format(eventDate, 'dd');
                const monthShort = format(eventDate, 'MMM', { locale: vi });

                const themeColors = [
                  { bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50' },
                  { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50' },
                  { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-50' },
                ];
                const theme = event.due ? themeColors[0] : (isTodayEvent ? themeColors[2] : themeColors[1]);

                return (
                  <div className="flex gap-4 items-center p-3 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer group" key={event.id}>
                    <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0 transition-all duration-300 ${isTodayEvent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                      <span className="text-sm font-black leading-none">{day}</span>
                      <span className="text-[9px] font-black uppercase mt-1 opacity-80">{monthShort}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-xs mb-1 truncate group-hover:text-indigo-600 transition-colors">{event.title}</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.bg}`}></span>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${theme.text}`}>
                          {event.type === 'task' ? 'Deadline' : 'Lịch'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
