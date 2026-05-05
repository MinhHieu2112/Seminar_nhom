'use client';

import { useState } from 'react';
import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Clock, Sparkles, CheckCircle2, Plus, X, Loader2, AlertCircle, Flag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ScheduleBlock } from '@/types/api';
import { useSchedule, useUpdateBlock, useCreateGoal, useGoals, useClearSchedule } from '@/lib/hooks/useScheduler';
import { useCreateCalendarEvent, useCalendarEvents, useCheckConflict } from '@/lib/hooks/useCalendar';
import { GenerateScheduleModal } from './GenerateScheduleModal';

const TASK_GRADIENTS = [
  { from: '#2563eb', to: '#1d4ed8', chip: 'rgba(255,255,255,0.16)' },
  { from: '#0f766e', to: '#0d9488', chip: 'rgba(255,255,255,0.18)' },
  { from: '#c2410c', to: '#ea580c', chip: 'rgba(255,255,255,0.18)' },
  { from: '#7c3aed', to: '#9333ea', chip: 'rgba(255,255,255,0.16)' },
  { from: '#be123c', to: '#e11d48', chip: 'rgba(255,255,255,0.18)' },
  { from: '#15803d', to: '#16a34a', chip: 'rgba(255,255,255,0.18)' },
];

function getTaskPalette(block: ScheduleBlock) {
  const seed = block.task?.id ?? block.taskId ?? block.task?.title ?? block.id;
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return TASK_GRADIENTS[hash % TASK_GRADIENTS.length];
}

function BlockCard({ block, onToggle }: { block: ScheduleBlock, onToggle: (block: ScheduleBlock) => void }) {
  const palette = getTaskPalette(block);
  const isDone = block.status === 'done';

  return (
    <div
      className={`group relative flex flex-col gap-1 rounded-lg p-2 text-white shadow-sm transition-all hover:shadow-md cursor-pointer ${
        isDone ? 'opacity-60 saturate-50' : ''
      }`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
      }}
      onClick={() => onToggle(block)}
    >
      <div className="flex items-center justify-between text-xs font-bold opacity-90">
        <span className={isDone ? 'line-through' : ''}>
          {format(parseISO(block.plannedStart), 'HH:mm')} -{' '}
          {format(parseISO(block.plannedEnd), 'HH:mm')}
        </span>
        {isDone && <CheckCircle2 className="h-4 w-4 text-white" />}
      </div>
      <p className={`line-clamp-2 text-sm font-medium leading-tight ${isDone ? 'line-through' : ''}`}>
        {block.task?.title || 'Phiên học'}
      </p>
      <p className="mt-0.5 text-[10px] opacity-75">
        Pomodoro #{block.pomodoroIndex}
      </p>
    </div>
  );
}

function DeadlineCard({ goal }: { goal: Goal }) {
  return (
    <div className="group relative flex items-center gap-2 rounded-lg border border-red-100 bg-red-50/50 p-2 text-red-700 shadow-sm transition-all hover:bg-red-50">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-100">
        <Flag className="h-3 w-3 text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider opacity-70">
          Deadline: {format(parseISO(goal.deadline!), 'HH:mm')}
        </p>
        <p className="truncate text-xs font-bold leading-tight">
          {goal.title}
        </p>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const isGoal = event.source === 'manual';

  return (
    <div
      className={`group relative flex flex-col gap-1 rounded-lg p-2 shadow-sm transition-all hover:shadow-md border-l-4 ${
        isGoal ? 'bg-purple-50 border-purple-500 text-purple-900' : 'bg-orange-50 border-orange-500 text-orange-900'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] font-bold opacity-70">
        <span>
          {format(parseISO(event.startTime), 'HH:mm')} -{' '}
          {format(parseISO(event.endTime), 'HH:mm')}
        </span>
        <Calendar className="h-3 w-3" />
      </div>
      <p className="line-clamp-2 text-xs font-semibold leading-tight">
        {event.title}
      </p>
      {event.description && (
        <p className="line-clamp-1 text-[9px] opacity-60 italic">
          {event.description}
        </p>
      )}
    </div>
  );
}

// ─── Period config ────────────────────────────────────────────────────────────

const PERIODS = [
  { id: 'morning', label: 'Sáng', time: '07:00 - 11:00', filter: (h: number) => h < 12 },
  { id: 'afternoon', label: 'Trưa / Chiều', time: '13:00 - 17:00', filter: (h: number) => h >= 12 && h < 18 },
  { id: 'evening', label: 'Tối', time: '18:00 - 22:00', filter: (h: number) => h >= 18 },
];

// ─── Main ScheduleView ────────────────────────────────────────────────────────

export function ScheduleView() {
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const from = startOfDay(weekStart).toISOString();
  const to = endOfDay(weekEnd).toISOString();

  const { data: blocks, isLoading: isLoadingBlocks } = useSchedule(from, to);
  const { data: events, isLoading: isLoadingEvents } = useCalendarEvents(from, to);
  const { data: goalData, isLoading: isLoadingGoals } = useGoals(1, 100);

  const updateBlock = useUpdateBlock();
  const clearSchedule = useClearSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const isPastWeek = weekEnd < new Date();
  const canClear = blocks && blocks.length > 0 && !isPastWeek;

  const handleClearSchedule = async () => {
    try {
      // Nếu tuần bắt đầu từ quá khứ, chỉ xóa từ thời điểm hiện tại trở đi
      const now = new Date();
      const clearFrom = weekStart < now ? now.toISOString() : from;
      
      await clearSchedule.mutateAsync(clearFrom);
      toast.success('Đã xóa lịch trình thành công');
      setIsConfirmClearOpen(false);
    } catch (err: unknown) {
      toast.error('Không thể xóa lịch trình');
    }
  };

  const handleToggleBlock = (block: ScheduleBlock) => {
    if (!block.id || block.id.startsWith('temp')) return;
    const newStatus = block.status === 'done' ? 'planned' : 'done';
    updateBlock.mutate({ blockId: block.id, status: newStatus });
  };

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const itemsByDay = days.map((day) => {
    const dayBlocks = (blocks ?? []).filter((b: ScheduleBlock) => isSameDay(parseISO(b.plannedStart), day));
    const dayEvents = (events ?? []).filter((e: CalendarEvent) => isSameDay(parseISO(e.startTime), day));
    const dayGoals = (goalData?.data ?? []).filter((g: Goal) => g.deadline && isSameDay(parseISO(g.deadline), day));
    
    // Deduplicate: If an event has the same title as a block, hide the event card
    const filteredEvents = dayEvents.filter(event => 
      !dayBlocks.some(block => (block.task?.title || 'Phiên học').toLowerCase() === event.title.toLowerCase())
    );

    return {
      date: day,
      blocks: dayBlocks,
      items: [
        ...dayBlocks.map(b => ({ type: 'block' as const, data: b, time: parseISO(b.plannedStart) })),
        ...filteredEvents.map(e => ({ type: 'event' as const, data: e, time: parseISO(e.startTime) })),
        ...dayGoals.map(g => ({ type: 'deadline' as const, data: g, time: parseISO(g.deadline!) }))
      ].sort((a, b) => a.time.getTime() - b.time.getTime())
    };
  });

  const isLoading = isLoadingBlocks || isLoadingEvents || isLoadingGoals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Week Navigator */}
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white hover:shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 px-4">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white hover:shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {canClear && (
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              disabled={clearSchedule.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-100 disabled:opacity-50"
            >
              {clearSchedule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Xóa lịch trình
            </button>
          )}

          {isPastWeek && blocks && blocks.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              Lịch trình quá hạn
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Tạo lịch học
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Đang tải lịch học...</span>
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto pb-4">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-3 mb-3">
                <div></div>
                {days.map((day) => {
                  const today = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${
                        today ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <p className={`text-sm font-medium ${today ? 'text-blue-600' : 'text-gray-500'}`}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-xl font-bold ${today ? 'text-blue-700' : 'text-gray-900'}`}>
                        {format(day, 'd')}
                      </p>
                      {!isSameMonth(day, new Date()) && (
                        <p className="text-xs text-gray-400">{format(day, 'MMM')}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Period Rows */}
              <div className="space-y-4">
                {PERIODS.map((period) => (
                  <div key={period.id} className="grid grid-cols-[100px_repeat(7,1fr)] gap-3">
                    {/* Row Header */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2 text-center border-2 border-dashed border-slate-200">
                      <span className="font-bold text-slate-700">{period.label}</span>
                      <span className="text-[10px] text-slate-500">{period.time}</span>
                    </div>

                    {/* Day Cells */}
                    {itemsByDay.map(({ date, items }) => {
                      const hourFilter = (time: Date) => period.filter(time.getHours());
                      const periodItems = items.filter(item => hourFilter(item.time));

                      return (
                        <div
                          key={date.toISOString()}
                          className={`rounded-xl border-2 p-2 min-h-[100px] transition-colors ${
                            isToday(date) ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="space-y-2 h-full">
                            {periodItems.length === 0 ? (
                              <div className="flex h-full min-h-[80px] items-center justify-center text-gray-300">
                                <span className="text-[11px] font-medium tracking-wide uppercase opacity-70">Trống</span>
                              </div>
                            ) : (
                              periodItems.map((item, idx) => {
                                if (item.type === 'block') return <BlockCard key={item.data.id || idx} block={item.data} onToggle={handleToggleBlock} />;
                                if (item.type === 'event') return <EventCard key={item.data.id || idx} event={item.data} />;
                                return <DeadlineCard key={item.data.id || idx} goal={item.data} />;
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {itemsByDay.map(({ date, items }) => {
              const today = isToday(date);
              return (
                <div
                  key={date.toISOString()}
                  className={`rounded-xl border-2 p-4 ${
                    today ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold ${today ? 'text-blue-700' : 'text-gray-900'}`}>
                        {format(date, 'EEEE')}
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        {format(date, 'MMM d')}
                      </span>
                    </div>
                    {today && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  <div className="space-y-5">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                          <Clock className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">Không có lịch trình</p>
                      </div>
                    ) : (
                      PERIODS.map((period) => {
                        const periodItems = items.filter(item =>
                          period.filter(item.time.getHours())
                        );

                        if (periodItems.length === 0) return null;

                        return (
                          <div key={period.id}>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              {period.label}
                            </p>
                            <div className="space-y-2">
                              {periodItems.map((item, idx) => {
                                if (item.type === 'block') return <BlockCard key={item.data.id || idx} block={item.data} onToggle={handleToggleBlock} />;
                                if (item.type === 'event') return <EventCard key={item.data.id || idx} event={item.data} />;
                                return <DeadlineCard key={item.data.id || idx} goal={item.data} />;
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Generate Schedule Modal */}
      <GenerateScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultFromDate={startOfDay(new Date()).toISOString()}
        defaultToDate={to}
      />

      {/* Custom Confirmation Modal */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa lịch trình</h3>
            <p className="text-sm text-gray-500 mb-6">
              Bạn có chắc chắn muốn xóa các lịch trình sắp tới trong tuần này? 
              <span className="block mt-2 font-medium text-red-600">Lưu ý: Các lịch trình đã diễn ra sẽ không bị xóa.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClearSchedule}
                disabled={clearSchedule.isPending}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {clearSchedule.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Xóa ngay
              </button>
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
