'use client';

import { useState } from 'react';
import { useSchedule, useClearSchedule } from '@/lib/hooks/useScheduler';
import { format, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from 'date-fns';
import type { ScheduleBlock } from '@/types/api';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Clock, Trash2 } from 'lucide-react';
import { GenerateScheduleModal } from './GenerateScheduleModal';

export function ScheduleView() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = endOfWeek(weekStart);

  const from = format(weekStart, "yyyy-MM-dd'T'00:00:00");
  const to = format(weekEnd, "yyyy-MM-dd'T'23:59:59");

  const { data: blocks, isLoading } = useSchedule(from, to);
  const clearSchedule = useClearSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function handlePrevWeek() {
    setWeekStart(addDays(weekStart, -7));
  }

  function handleNextWeek() {
    setWeekStart(addDays(weekStart, 7));
  }

  function handleGenerate() {
    setIsModalOpen(true);
  }

  const blocksByDay = days.map((day) => ({
    date: day,
    blocks:
      blocks?.filter((block: ScheduleBlock) => {
        const blockDate = new Date(block.plannedStart);
        return (
          blockDate.getDate() === day.getDate() &&
          blockDate.getMonth() === day.getMonth()
        );
      }) || [],
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1">
          <button
            onClick={handlePrevWeek}
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
            onClick={handleNextWeek}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-white hover:shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your current schedule?')) {
                clearSchedule.mutate();
              }
            }}
            disabled={clearSchedule.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
          >
            {clearSchedule.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear
          </button>
          
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            <Sparkles className="h-4 w-4" />
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Week View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Loading schedule...</span>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {blocksByDay.map(({ date, blocks }) => {
            const today = isToday(date);
            return (
              <div
                key={date.toISOString()}
                className={`rounded-xl border-2 p-3 transition-all ${
                  today
                    ? 'border-blue-200 bg-blue-50/50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`mb-3 border-b pb-2 text-center ${today ? 'border-blue-200' : 'border-gray-100'}`}>
                  <p className={`text-xs font-medium ${today ? 'text-blue-600' : 'text-gray-500'}`}>
                    {format(date, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${today ? 'text-blue-700' : 'text-gray-900'}`}>
                    {format(date, 'd')}
                  </p>
                  {!isSameMonth(date, new Date()) && (
                    <p className="text-xs text-gray-400">{format(date, 'MMM')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                        <Clock className="h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-400">Free</p>
                    </div>
                  ) : (
                    blocks.map((block: ScheduleBlock) => (
                      <div
                        key={block.id}
                        className="group relative flex flex-col gap-1 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 p-2 text-white shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between text-xs font-bold opacity-90">
                          <span>
                            {format(new Date(block.plannedStart), 'HH:mm')} - {format(new Date(block.plannedEnd), 'HH:mm')}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-medium leading-tight">
                          {block.task?.title || block.task?.title || 'Study Session'}
                        </p>
                        <p className="mt-0.5 text-[10px] opacity-75">
                          Pomodoro #{block.pomodoroIndex}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Schedule Modal */}
      <GenerateScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultFromDate={format(new Date(), "yyyy-MM-dd'T'00:00:00")}
        defaultToDate={to}
      />
    </div>
  );
}
