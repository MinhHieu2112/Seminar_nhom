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
import { Calendar, ChevronLeft, ChevronRight, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ScheduleBlock } from '@/types/api';
import { useSchedule, useUpdateBlock } from '@/lib/hooks/useScheduler';
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
        {block.task?.title || 'Study Session'}
      </p>
      <p className="mt-0.5 text-[10px] opacity-75">
        Pomodoro #{block.pomodoroIndex}
      </p>
    </div>
  );
}

const PERIODS = [
  { id: 'morning', label: 'Sáng', time: '00:00 - 12:00', filter: (h: number) => h < 12 },
  { id: 'afternoon', label: 'Trưa / Chiều', time: '12:00 - 18:00', filter: (h: number) => h >= 12 && h < 18 },
  { id: 'evening', label: 'Tối', time: '18:00 - 24:00', filter: (h: number) => h >= 18 },
];

export function ScheduleView() {
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const from = startOfDay(weekStart).toISOString();
  const to = endOfDay(weekEnd).toISOString();

  const { data: blocks, isLoading } = useSchedule(from, to);

  const updateBlock = useUpdateBlock();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleBlock = (block: ScheduleBlock) => {
    if (!block.id || block.id.startsWith('temp')) return; // Just in case AI gen blocks don't have id yet, though they should
    const newStatus = block.status === 'done' ? 'planned' : 'done';
    updateBlock.mutate({ blockId: block.id, status: newStatus });
  };

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const blocksByDay = days.map((day) => ({
    date: day,
    blocks:
      blocks
        ?.filter((block: ScheduleBlock) =>
          isSameDay(parseISO(block.plannedStart), day),
        )
        .sort(
          (left, right) =>
            parseISO(left.plannedStart).getTime() -
            parseISO(right.plannedStart).getTime(),
        ) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Generate Schedule
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Loading schedule...</span>
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
                    {blocksByDay.map(({ date, blocks: dayBlocks }) => {
                      const periodBlocks = dayBlocks.filter((b) =>
                        period.filter(parseISO(b.plannedStart).getHours())
                      );

                      return (
                        <div
                          key={date.toISOString()}
                          className={`rounded-xl border-2 p-2 min-h-[100px] transition-colors ${
                            isToday(date) ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="space-y-2 h-full">
                            {periodBlocks.length === 0 ? (
                              <div className="flex h-full min-h-[80px] items-center justify-center text-gray-300">
                                <span className="text-[11px] font-medium tracking-wide uppercase opacity-70">Trống</span>
                              </div>
                            ) : (
                              periodBlocks.map((block) => (
                                <BlockCard key={block.id} block={block} onToggle={handleToggleBlock} />
                              ))
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
            {blocksByDay.map(({ date, blocks: dayBlocks }) => {
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
                        Today
                      </span>
                    )}
                  </div>

                  <div className="space-y-5">
                    {dayBlocks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                          <Clock className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">Không có lịch trình</p>
                      </div>
                    ) : (
                      PERIODS.map((period) => {
                        const periodBlocks = dayBlocks.filter((b) =>
                          period.filter(parseISO(b.plannedStart).getHours())
                        );

                        if (periodBlocks.length === 0) return null;

                        return (
                          <div key={period.id}>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              {period.label}
                            </p>
                            <div className="space-y-2">
                              {periodBlocks.map((block) => (
                                <BlockCard key={block.id} block={block} onToggle={handleToggleBlock} />
                              ))}
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

      <GenerateScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultFromDate={startOfDay(new Date()).toISOString()}
        defaultToDate={to}
      />
    </div>
  );
}
