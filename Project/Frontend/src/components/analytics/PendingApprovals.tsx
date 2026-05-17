'use client';

import { memo } from 'react';
import { Warning, Clock } from '@phosphor-icons/react';

const PRIORITY_STYLE = {
  high:   'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-gray-100 text-gray-500',
};

const PRIORITY_LABEL = {
  high: 'Cao', medium: 'Trung bình', low: 'Thấp',
};

interface PendingApprovalItem {
  id: string;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

interface Props {
  data?: PendingApprovalItem[];
  stats?: {
    pending: number;
    reviewing: number;
    completed: number;
    overdue: number;
  };
}

export const PendingApprovals = memo(function PendingApprovals({ data = [], stats }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <div className="flex items-center gap-2 mb-1">
        <Warning className="w-4 h-4 text-amber-500" />
        <h3 className="text-base font-bold text-gray-800">Task chờ phê duyệt</h3>
        <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {data.length}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-5">Danh sách task cần leader xem xét</p>

      {/* Thống kê trạng thái task nhóm */}
      <div className="grid grid-cols-4 gap-2 mb-5 shrink-0">
        {/* Đang chờ */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đang chờ</p>
          <p className="text-lg font-black text-slate-700">{stats?.pending ?? 0}</p>
        </div>
        {/* Xét duyệt */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Xét duyệt</p>
          <p className="text-lg font-black text-amber-600">{stats?.reviewing ?? 0}</p>
        </div>
        {/* Xong */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Xong</p>
          <p className="text-lg font-black text-emerald-600">{stats?.completed ?? 0}</p>
        </div>
        {/* Trễ hạn */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Trễ hạn</p>
          <p className="text-lg font-black text-rose-600">{stats?.overdue ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Không có task nào chờ phê duyệt
          </div>
        ) : (
          data.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Người thực hiện: <span className="font-medium text-gray-600">{item.assignee}</span></p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[item.priority as keyof typeof PRIORITY_STYLE]}`}>
                  {PRIORITY_LABEL[item.priority as keyof typeof PRIORITY_LABEL]}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {item.dueDate}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
