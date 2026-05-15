'use client';

import React, { useState, useMemo, memo } from 'react';
import { useSchedulerAllocations, useSchedulerTasks } from '@/hooks/useScheduler';
import {
    format, startOfWeek, addDays, startOfDay, endOfDay, addWeeks, subWeeks, isSameDay, parseISO
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { Allocation, Task } from '@/types/api';

// --- Hằng số di chuyển ra ngoài để tránh khởi tạo lại ---
const TIME_PHASES = [
    { id: 'morning', label: 'Buổi sáng', start: 6, end: 11, bg: 'bg-white' },
    { id: 'afternoon', label: 'Buổi trưa', start: 12, end: 17, bg: 'bg-[#fcfdfe]' },
    { id: 'evening', label: 'Buổi tối', start: 18, end: 22, bg: 'bg-white' }
];

const COLOR_STYLES = [
    { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' },
    { bg: 'bg-sky-50', border: 'border-sky-500', text: 'text-sky-700' },
    { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' },
    { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700' },
    { bg: 'bg-violet-50', border: 'border-violet-500', text: 'text-violet-700' },
];

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// --- Component con được Memoize để tăng tốc độ render ---
const TimeBlock = memo(({ event, phaseStart }: { event: Allocation; phaseStart: number }) => {
    const startDate = parseISO(event.startTime);
    const startHour = startDate.getHours();
    const startMin = startDate.getMinutes();
    const duration = event.durationMinutes || 60;

    const top = (startHour - phaseStart) * 64 + (startMin / 60) * 64;
    const height = (duration / 60) * 64;

    const styleIdx = (parseInt(event.id.slice(-1), 16) || 0) % COLOR_STYLES.length;
    const style = COLOR_STYLES[styleIdx];

    return (
        <div
            className={`absolute left-1 right-1 rounded-xl border-l-[4px] p-2 shadow-sm flex flex-col overflow-hidden ${style.bg} ${style.border} ${style.text} transition-transform hover:scale-[1.02] hover:z-20 cursor-pointer`}
            style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
        >
            <span className="text-[10px] font-extrabold leading-tight uppercase truncate">{event.task?.title}</span>
            {height > 40 && <span className="text-[9px] font-medium opacity-70 mt-1">{format(startDate, 'HH:mm')}</span>}
        </div>
    );
});

TimeBlock.displayName = 'TimeBlock';

export default function SchedulerPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const { data: allocations = [] } = useSchedulerAllocations(
        startOfDay(weekStart).toISOString(),
        endOfDay(weekEnd).toISOString()
    );

    const { data: tasks = [] } = useSchedulerTasks();

    const allEvents = useMemo(() => {
        const events: Allocation[] = [...allocations];
        const existingTaskIds = new Set(allocations.filter(a => a.task).map(a => a.task!.id));

        tasks.forEach((t: Task) => {
            if (t.dueTime && !existingTaskIds.has(t.id)) {
                // Determine if task falls in the current week window we fetched
                const due = parseISO(t.dueTime);
                if (due >= startOfDay(weekStart) && due <= endOfDay(weekEnd)) {
                    events.push({
                        id: `mapped-${t.id}`,
                        startTime: t.dueTime,
                        durationMinutes: 60,
                        task: {
                            id: t.id,
                            title: t.title
                        }
                    });
                }
            }
        });
        return events;
    }, [allocations, tasks, weekStart, weekEnd]);

    // --- TỐI ƯU QUAN TRỌNG: Nhóm dữ liệu trước khi render ---
    const groupedAllocations = useMemo(() => {
        const groups: Record<string, Allocation[]> = {};
        allEvents.forEach((a: Allocation) => {
            const dateKey = format(parseISO(a.startTime), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(a);
        });
        return groups;
    }, [allEvents]);

    const DAYS = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    return (
        <div className="min-h-screen bg-[#f8f9fc] text-slate-700 pb-10">
            {/* Header */}
            <header className="top-0 z-30 bg-[#f8f9fc]/80 backdrop-blur-md pb-4 px-6 max-w-350 mx-auto flex items-end justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-1">
                        {format(currentDate, 'MMMM yyyy', { locale: vi })}
                    </span>
                    <div className="flex items-center gap-6">
                        <h1 className="text-5xl font-black tracking-tighter text-slate-800">Lịch trình</h1>
                        <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
                            <button onClick={handlePrevWeek} className="p-2.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95"><CaretLeft weight="bold" size={18} /></button>
                            <button onClick={handleToday} className="px-6 py-2 hover:bg-indigo-50 rounded-xl text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors">Hôm nay</button>
                            <button onClick={handleNextWeek} className="p-2.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95"><CaretRight weight="bold" size={18} /></button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 mt-4 flex flex-col gap-8">
                {TIME_PHASES.map((phase) => (
                    <section key={phase.id} className={`${phase.bg} rounded-4xl border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden`}>
                        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{phase.label}</h3>
                            <div className="h-[1px] flex-1 mx-6 bg-slate-100"></div>
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{phase.start}:00 – {phase.end}:00</span>
                        </div>

                        <div className="flex">
                            {/* Trục giờ */}
                            <div className="w-20 shrink-0 border-r border-slate-100 flex flex-col pt-12 bg-slate-50/30">
                                {Array.from({ length: phase.end - phase.start + 1 }, (_, i) => phase.start + i).map(h => (
                                    <div key={h} className="h-16 flex items-start justify-center">
                                        <span className="text-[10px] font-semibold text-slate-300 tabular-nums -translate-y-2">{h}:00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Lưới lịch */}
                            <div className="flex-1 flex overflow-x-auto">
                                {DAYS.map((day, dIdx) => {
                                    const dateKey = format(day, 'yyyy-MM-dd');
                                    const dayEvents = groupedAllocations[dateKey] || [];
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div key={dIdx} className={`flex-1 min-w-30 border-r border-slate-100 last:border-0 relative ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                            {/* Header ngày */}
                                            <div className={`h-12 flex flex-col items-center justify-center border-b border-slate-100/50 sticky top-0 z-10 transition-colors ${isToday ? 'bg-indigo-50/60' : 'bg-white/40'}`}>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-indigo-500' : 'text-slate-300'}`}>{DAY_NAMES[dIdx]}</span>
                                                <span className={`text-sm font-black ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{format(day, 'dd')}</span>
                                            </div>

                                            {/* Khu vực chứa Event */}
                                            <div className="relative overflow-hidden" style={{ height: `${(phase.end - phase.start + 1) * 64}px` }}>
                                                {Array.from({ length: phase.end - phase.start + 1 }).map((_, i) => (
                                                    <div key={i} className="h-16 border-b border-slate-50/50"></div>
                                                ))}
                                                {dayEvents.filter((event: Allocation) => {
                                                    const startHour = parseISO(event.startTime).getHours();
                                                    return startHour >= phase.start && startHour <= phase.end;
                                                }).map((event: Allocation) => (
                                                    <TimeBlock key={event.id} event={event} phaseStart={phase.start} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}