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
}

export const PendingApprovals = memo(function PendingApprovals({ data = [] }: Props) {
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
