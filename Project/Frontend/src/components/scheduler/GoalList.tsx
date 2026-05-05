import { useState } from 'react';
import Link from 'next/link';
import { useGoals, useDeleteGoal } from '@/lib/hooks/useScheduler';
import { useCalendarEvents, useDeleteCalendarEvent } from '@/lib/hooks/useCalendar';
import type { Goal, CalendarEvent } from '@/types/api';
import {
  Target,
  Calendar,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  FileText,
  Tag,
  X,
} from 'lucide-react';
import { TaskList } from './TaskList';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function priorityLabel(priority: number) {
  if (priority >= 2) return { label: 'High', color: 'bg-red-100 text-red-700' };
  if (priority === 1) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Low', color: 'bg-green-100 text-green-700' };
}

export function GoalList() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedGoalIdForTasks, setSelectedGoalIdForTasks] = useState<string | null>(null);

  const { data: goalData, isLoading: goalsLoading } = useGoals(page, limit);
  const { data: calendarEvents, isLoading: eventsLoading } = useCalendarEvents();
  const deleteGoal = useDeleteGoal();
  const deleteEvent = useDeleteCalendarEvent();

  const goals = goalData?.data || [];
  const calendarItems = (calendarEvents ?? []);
  
  const combinedItems = [
    ...goals.map(g => ({ ...g, itemType: 'goal' as const })),
    ...calendarItems.map(e => ({ ...e, itemType: 'event' as const }))
  ].sort((a, b) => {
    const dateA = new Date('deadline' in a ? (a.deadline || 0) : a.endTime).getTime();
    const dateB = new Date('deadline' in b ? (b.deadline || 0) : b.endTime).getTime();
    return dateB - dateA;
  });

  const totalItems = (goalData?.total || 0) + calendarItems.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const isLoading = goalsLoading || eventsLoading;

  const selectedGoal = goals.find(g => g.id === selectedGoalIdForTasks);

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium text-gray-500">Đang đồng bộ dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
      {/* Table Header / Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 border border-gray-200/60 px-3.5 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-100/80">
            <Target className="h-4 w-4 text-blue-600" />
            <span>Tất cả mục tiêu & Lịch trình</span>
          </div>
          <span className="text-sm font-medium text-gray-400">
            {totalItems} mục mục
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/30">
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">AA Task name</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Status</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Due date</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Priority</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Task type</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Description</th>
              <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {combinedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium">Chưa có mục tiêu nào được tạo</p>
                  </div>
                </td>
              </tr>
            ) : (
              combinedItems.map((item) => {
                const isGoal = item.itemType === 'goal';
                const id = item.id;
                const title = item.title;
                const description = item.description;
                const status = isGoal ? (item as Goal).status : 'scheduled';
                const deadline = isGoal ? (item as Goal).deadline : (item as CalendarEvent).endTime;
                const priority = isGoal ? 1 : ((item as CalendarEvent).priority ?? 1);
                const prio = priorityLabel(priority);

                return (
                  <tr key={`${item.itemType}-${id}`} className="group hover:bg-blue-50/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isGoal ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-600">
                            <Target className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-50 text-purple-600">
                            <Calendar className="h-4 w-4" />
                          </div>
                        )}
                        {isGoal ? (
                          <button 
                            onClick={() => setSelectedGoalIdForTasks(id)}
                            className="text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {title}
                          </button>
                        ) : (
                          <span className="font-semibold text-gray-900">{title}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        status === 'completed' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        {status === 'completed' ? 'Done' : 'In progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                      {deadline ? formatDateTime(deadline) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${prio.color}`}>
                        {prio.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                        isGoal ? 'bg-slate-100 text-slate-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        <Tag className="h-3 w-3 opacity-50" />
                        {isGoal ? 'Goal' : 'Event'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-400 line-clamp-1 max-w-[180px]">
                        {description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Xóa ${isGoal ? 'mục tiêu' : 'lịch'} này?`)) {
                            if (isGoal) deleteGoal.mutate(id);
                            else deleteEvent.mutate(id);
                          }
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Notion-style Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 bg-gray-50/30">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trang {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-4 w-4"/>
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages} 
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-4 w-4"/>
            </button>
          </div>
        </div>
      )}

      {/* Task Manager Modal */}
      {selectedGoalIdForTasks && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedGoal?.title || 'Quản lý nhiệm vụ'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Danh sách nhiệm vụ nhỏ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xóa hoàn toàn mục tiêu này và tất cả nhiệm vụ bên trong?')) {
                      deleteGoal.mutate(selectedGoalIdForTasks!, {
                        onSuccess: () => setSelectedGoalIdForTasks(null)
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa mục tiêu
                </button>
                <button 
                  onClick={() => setSelectedGoalIdForTasks(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TaskList goalId={selectedGoalIdForTasks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
