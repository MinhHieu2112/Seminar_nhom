'use client';

import { memo } from 'react';



import type { FilterPeriod, FilterScope } from '@/hooks/useAnalyticsDashboard';

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'weekly',  label: 'Tuần này' },
  { value: 'monthly', label: 'Tháng này' },
  { value: 'yearly',  label: 'Năm nay' },
  { value: 'custom',  label: 'Tùy chỉnh' },
];

interface Props {
  period:    FilterPeriod;
  scope:     FilterScope;
  metric:    'tasks' | 'hours';
  customFrom?: string;
  customTo?:   string;
  onPeriod:    (v: FilterPeriod)          => void;
  onScope:     (v: FilterScope)           => void;
  onMetric:    (v: 'tasks' | 'hours')     => void;
  onCustomRange: (from: string, to: string) => void;
  isConnected: boolean;
}

export const AnalyticsFilters = memo(function AnalyticsFilters({
  period, scope, metric, customFrom, customTo, onPeriod, onScope, onMetric, onCustomRange, isConnected,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      {/* Period selector */}
      <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-0.5">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onPeriod(opt.value)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
              period === opt.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom Range Picker */}
      {period === 'custom' && (
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-2 px-3">
          <input
            type="date"
            value={customFrom?.split('T')[0] || ''}
            onChange={(e) => onCustomRange(new Date(e.target.value).toISOString(), customTo || new Date().toISOString())}
            className="text-[13px] font-semibold text-gray-600 outline-none bg-transparent"
          />
          <span className="text-gray-300">→</span>
          <input
            type="date"
            value={customTo?.split('T')[0] || ''}
            onChange={(e) => onCustomRange(customFrom || new Date().toISOString(), new Date(e.target.value).toISOString())}
            className="text-[13px] font-semibold text-gray-600 outline-none bg-transparent"
          />
        </div>
      )}

      {/* Scope toggle */}
      <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-0.5">
        {(['personal', 'team'] as FilterScope[]).map(s => (
          <button
            key={s}
            onClick={() => onScope(s)}
            className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
              scope === s
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {s === 'personal' ? '👤 Cá nhân' : '👥 Nhóm'}
          </button>
        ))}
      </div>

      {/* Team metric selector – only visible in team scope */}
      {scope === 'team' && (
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-0.5">
          {(['tasks', 'hours'] as const).map(m => (
            <button
              key={m}
              onClick={() => onMetric(m)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                metric === m
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {m === 'tasks' ? 'Số Task' : 'Số Giờ'}
            </button>
          ))}
        </div>
      )}

      {/* Realtime badge */}
      <div className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border ${
        isConnected
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-gray-50 border-gray-200 text-gray-400'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
        {isConnected ? 'Realtime' : 'Offline'}
      </div>
    </div>
  );
});
