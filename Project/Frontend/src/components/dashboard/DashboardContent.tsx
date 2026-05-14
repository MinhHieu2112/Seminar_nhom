'use client';

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
} from '@phosphor-icons/react';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { useSchedulerTasks, useSchedulerAllocations } from '@/lib/hooks/useScheduler';
import type { Task, Allocation } from '@/types/api';
import { useAnalyticsDashboard } from '@/lib/hooks/useAnalytics';

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
  const { data: analyticsData } = useAnalyticsDashboard();
  const analytics = analyticsData || {
    completionRate: 0,
    productivityScore: 0,
    timeDistribution: { morning: 0, afternoon: 0, evening: 0 },
    suggestions: [],
    summary: { totalGoals: 0, activeGoals: 0, completedGoals: 0, totalTasks: 0, pendingTasks: 0, completedTasks: 0, overdueTasks: 0, plannedBlocks: 0, completedBlocks: 0 },
    weeklyOverview: { scheduledBlocks: 0, studyHours: 0, completedTasks: 0 }
  };

  const { data: tasks = [] } = useSchedulerTasks();
  const today = new Date();
  const { data: allocations = [] } = useSchedulerAllocations(
    startOfDay(today).toISOString(),
    endOfDay(addDays(today, 7)).toISOString()
  );

  const activeGoals = tasks.filter((t: Task) => t.status === 'pending');
  const upcomingEvents = allocations.map((a: Allocation) => ({
    id: a.id,
    title: a.task?.title || 'No Title',
    startTime: a.startTime,
    source: 'system'
  }));

  const primaryGoal = activeGoals.length > 0 ? activeGoals[0] : null;

  const todayDate = new Date();

  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blankDays = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarBlanks = Array.from({ length: blankDays }, (_, i) => i);
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Base premium glassmorphism classes
  const glassCardClass = "bg-white/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
  const softShadowClass = "shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-shadow duration-300";

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-12">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-8">

        {/* Active Task Banner */}
        <div className={`${glassCardClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Target weight="duotone" size={28} />
            </div>
            <div className="flex-1">
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1.5">Mục tiêu hiện tại</div>
              <h2 className="text-gray-900 font-extrabold text-xl leading-tight truncate max-w-[200px] sm:max-w-[300px]">
                {primaryGoal ? primaryGoal.title : 'Chưa có mục tiêu'}
              </h2>
              <div className="mt-3.5">
                <div className="h-1.5 w-full bg-gray-100/80 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: primaryGoal ? '45%' : '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-5 text-sm font-semibold text-gray-500">
              <div className="flex items-center gap-2"><ListChecks weight="duotone" size={20} className="text-pink-400" /> {analytics.summary.activeGoals} Active</div>
              <div className="flex items-center gap-2"><Clock weight="duotone" size={20} className="text-green-400" /> {analytics.summary.totalTasks} Tasks</div>
            </div>
            <Link href="/scheduler/goals" className="bg-purple-100/80 hover:bg-purple-200 text-purple-700 transition flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap shadow-sm">
              <Play weight="fill" size={16} className="text-purple-600" /> Tiếp tục
            </Link>
          </div>
        </div>

        {/* Status Cards */}
        <div>
          <h3 className="font-extrabold text-gray-900 text-xl mb-5">Trạng thái Tổng quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Goals */}
            <div className={`bg-[#fffaf0]/80 backdrop-blur-xl rounded-3xl p-6 flex justify-between items-start ${softShadowClass}`}>
              <div>
                <div className="bg-orange-500/10 p-2.5 rounded-2xl inline-flex text-orange-600 mb-5">
                  <Target weight="duotone" size={24} />
                </div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">{analytics.summary.totalGoals}</div>
                <div className="text-sm font-bold text-gray-500 mt-1">Mục tiêu</div>
                <div className="text-xs font-semibold text-orange-500 mt-2">{analytics.summary.completedGoals} đã hoàn thành</div>
              </div>
              <CircularProgress percent={analytics.summary.totalGoals > 0 ? Math.round((analytics.summary.completedGoals / analytics.summary.totalGoals) * 100) : 0} colorClass="text-orange-500" />
            </div>

            {/* Card 2: Tasks */}
            <div className={`bg-[#fff5f8]/80 backdrop-blur-xl rounded-3xl p-6 flex justify-between items-start ${softShadowClass}`}>
              <div>
                <div className="bg-pink-500/10 p-2.5 rounded-2xl inline-flex text-pink-600 mb-5">
                  <CheckSquare weight="duotone" size={24} />
                </div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">{analytics.summary.totalTasks}</div>
                <div className="text-sm font-bold text-gray-500 mt-1">Công việc</div>
                <div className="text-xs font-semibold text-pink-500 mt-2">{analytics.summary.completedTasks} đã hoàn thành</div>
              </div>
              <CircularProgress percent={analytics.summary.totalTasks > 0 ? Math.round((analytics.summary.completedTasks / analytics.summary.totalTasks) * 100) : 0} colorClass="text-pink-500" />
            </div>

            {/* Card 3: Blocks */}
            <div className={`bg-[#f0fdf4]/80 backdrop-blur-xl rounded-3xl p-6 flex justify-between items-start ${softShadowClass}`}>
              <div>
                <div className="bg-green-500/10 p-2.5 rounded-2xl inline-flex text-green-600 mb-5">
                  <Clock weight="duotone" size={24} />
                </div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">{analytics.summary.plannedBlocks}</div>
                <div className="text-sm font-bold text-gray-500 mt-1">Chu kỳ Focus</div>
                <div className="text-xs font-semibold text-green-600 mt-2">{analytics.summary.completedBlocks} đã hoàn thành</div>
              </div>
              <CircularProgress percent={analytics.summary.plannedBlocks > 0 ? Math.round((analytics.summary.completedBlocks / Math.max(1, analytics.summary.plannedBlocks)) * 100) : 0} colorClass="text-green-500" />
            </div>
          </div>
        </div>

        {/* My Plans List */}
        <div className={glassCardClass}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-gray-900 text-xl">Kế hoạch của tôi</h3>
            <div className="flex gap-2 text-sm font-bold bg-gray-100/50 p-1.5 rounded-2xl">
              <button className="text-purple-700 bg-white px-5 py-2 rounded-xl shadow-sm">Đang học</button>
              <button className="text-gray-500 hover:text-gray-800 px-5 py-2 rounded-xl transition">Lịch sử</button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2fr_1fr] text-xs font-black text-gray-400 uppercase tracking-widest mb-5 px-2">
            <div>Mục tiêu</div>
            <div>Tiến độ</div>
            <div className="text-right">Trạng thái</div>
          </div>

          <div className="space-y-6">
            {activeGoals.slice(0, 4).map((goal: Task, index: number) => {
              const colors = [
                { bg: 'bg-purple-500/10', text: 'text-purple-600', bar: 'bg-purple-500' },
                { bg: 'bg-orange-500/10', text: 'text-orange-600', bar: 'bg-orange-500' },
                { bg: 'bg-pink-500/10', text: 'text-pink-600', bar: 'bg-pink-500' },
                { bg: 'bg-blue-500/10', text: 'text-blue-600', bar: 'bg-blue-500' }
              ];
              const theme = colors[index % colors.length];

              return (
                <div className="grid grid-cols-[1fr_2fr_1fr] items-center gap-5 px-2 py-2 group" key={goal.id}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text}`}>
                      <BookOpenText weight="duotone" size={24} />
                    </div>
                    <div className="font-extrabold text-gray-900 text-[15px] truncate max-w-[150px] group-hover:text-purple-600 transition-colors">{goal.title}</div>
                  </div>

                  <div className="w-full relative">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${theme.bar} rounded-full`} style={{ width: '40%' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 text-xs font-bold text-gray-400">
                    <span className="flex items-center gap-1.5"><Clock weight="duotone" size={16} /> 15</span>
                    <span className="flex items-center gap-1.5"><CheckSquare weight="duotone" size={16} /> 6</span>
                    <span className="flex items-center gap-1.5 text-gray-300 ml-2"><Target weight="duotone" size={16} /> 3</span>
                  </div>
                </div>
              )
            })}

            {activeGoals.length === 0 && (
              <div className="text-center py-8 text-gray-400 font-semibold italic">
                Chưa có kế hoạch hoạt động nào.
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
            <h3 className="font-extrabold text-gray-900 text-xl">Lịch trình</h3>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-purple-600 transition p-1.5 hover:bg-purple-50 rounded-xl"><CaretLeft weight="bold" size={18} /></button>
              <button className="text-gray-400 hover:text-purple-600 transition p-1.5 hover:bg-purple-50 rounded-xl"><CaretRight weight="bold" size={18} /></button>
            </div>
          </div>

          <div className="text-xs font-black text-gray-400 text-center mb-5 uppercase flex justify-center tracking-widest">
            {currentMonthName}
          </div>

          <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center text-[13px]">
            {dayNames.map(d => <div key={d} className="font-black text-gray-400">{d}</div>)}

            {calendarBlanks.map(blank => <div key={`blank-${blank}`}></div>)}

            {calendarDates.map(date => {
              const isToday = date === currentDate.getDate();
              const hasEvent = date % 5 === 0;

              if (isToday) {
                return (
                  <div key={date} className="w-9 h-9 mx-auto flex items-center justify-center rounded-2xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-300/50">
                    {date}
                  </div>
                )
              }
              if (hasEvent) {
                return (
                  <div key={date} className="w-9 h-9 mx-auto flex items-center justify-center rounded-2xl bg-purple-50 text-purple-600 font-bold">
                    {date}
                  </div>
                )
              }
              return (
                <div key={date} className="w-9 h-9 mx-auto flex items-center justify-center rounded-2xl text-gray-600 font-bold hover:bg-gray-100 cursor-pointer transition-colors">
                  {date}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className={glassCardClass}>
          <h3 className="font-extrabold text-gray-900 text-xl mb-7">Sắp diễn ra</h3>

          <div className="space-y-6">
            {!upcomingEvents?.length && (
              <div className="text-center py-8 text-gray-400 font-semibold italic">
                Không có lịch trình sắp tới.
              </div>
            )}

            {upcomingEvents?.slice(0, 5).map((event, index: number) => {
              const eventDate = new Date(event.startTime);
              const isToday = eventDate.getDate() === todayDate.getDate();
              const monthShort = eventDate.toLocaleString('default', { month: 'short' });

              const dotColors = ['bg-pink-500', 'bg-green-500', 'bg-blue-500', 'bg-orange-500'];
              const dotColor = dotColors[index % dotColors.length];

              return (
                <div className="flex gap-5 items-center group cursor-pointer" key={event.id}>
                  <div className={`flex flex-col items-center justify-center min-w-[3.5rem] h-[3.5rem] rounded-2xl transition-all duration-300 ${isToday ? 'bg-purple-100 text-purple-700 shadow-inner' : 'bg-gray-100 text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-600'}`}>
                    <span className="text-lg font-black leading-none">{eventDate.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase mt-1 opacity-80">{monthShort}</span>
                  </div>
                  <div className="border-b border-gray-100/50 pb-5 flex-1 pt-1 group-last:border-0 group-last:pb-0">
                    <div className="font-extrabold text-gray-900 text-[15px] mb-1.5 group-hover:text-purple-600 transition-colors">{event.title}</div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${dotColor}`}></span>
                      {event.source === 'system' ? 'Lên lịch tự động' : 'Công việc'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
