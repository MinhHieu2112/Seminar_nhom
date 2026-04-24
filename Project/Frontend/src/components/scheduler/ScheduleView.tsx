'use client';

import { useState } from 'react';
import { useSchedule, useGenerateSchedule } from '@/lib/hooks/useScheduler';
import { format, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from 'date-fns';
import type { ScheduleBlock } from '@/types/api';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export function ScheduleView() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const weekEnd = endOfWeek(weekStart);

  const from = format(weekStart, "yyyy-MM-dd'T'00:00:00");
  const to = format(weekEnd, "yyyy-MM-dd'T'23:59:59");

  const { data: blocks, isLoading } = useSchedule(from, to);
  const generateSchedule = useGenerateSchedule();

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function handlePrevWeek() {
    setWeekStart(addDays(weekStart, -7));
  }

  function handleNextWeek() {
    setWeekStart(addDays(weekStart, 7));
  }

  function handleGenerate() {
    generateSchedule.mutate({
      fromDate: from,
      toDate: to,
    });
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

        <button
          onClick={handleGenerate}
          disabled={generateSchedule.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {generateSchedule.isPending ? 'Generating...' : 'Generate Schedule'}
        </button>
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
                        className="group relative rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-xs text-white shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {format(new Date(block.plannedStart), 'HH:mm')}
                          </span>
                        </div>
                        <p className="mt-0.5 text-blue-100">
                          #{block.pomodoroIndex}
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

      {/* Status Messages */}
      {generateSchedule.isSuccess && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">
            {generateSchedule.data?.message || 'Schedule generated successfully!'}
          </p>
        </div>
      )}

      {generateSchedule.isError && (
        <div className="rounded-xl bg-red-50 p-4 text-red-800">
          <p className="font-medium">
            Error: {generateSchedule.error?.message || 'Failed to generate schedule'}
          </p>
        </div>
      )}
    </div>
  );
}
