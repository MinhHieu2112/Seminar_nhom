'use client';

import { memo } from 'react';

import type { FilterPeriod } from '@/hooks/useAnalyticsDashboard';

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'weekly',  label: 'Tuần này' },
  { value: 'monthly', label: 'Tháng này' },
  { value: 'yearly',  label: 'Năm nay' },
  { value: 'custom',  label: 'Tùy chỉnh' },
];

interface Props {
  period:      FilterPeriod;
  customFrom?: string;
  customTo?:   string;
  onPeriod:    (v: FilterPeriod)            => void;
  onCustomRange: (from: string, to: string) => void;
  isConnected: boolean;
}

export const AnalyticsFilters = memo(function AnalyticsFilters({
  period, customFrom, customTo, onPeriod, onCustomRange, isConnected,
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

      {/* Connection status indicator */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-300'}`} />
        <span className="text-[11px] font-semibold text-gray-400">
          {isConnected ? 'Realtime' : 'Offline'}
        </span>
      </div>
    </div>
  );
});
