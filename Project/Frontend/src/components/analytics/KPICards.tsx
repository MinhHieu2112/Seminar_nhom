'use client';

import { memo } from 'react';
import { CheckCircle, Clock, WarningCircle, TrendUp, Lightning, BookOpen } from '@phosphor-icons/react';

import type { DashboardData } from '@/hooks/useAnalyticsDashboard';

const KPI_CONFIG = [
  {
    key: 'completedTasks',
    label: 'Task hoàn thành',
    icon: BookOpen,
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    textColor: 'text-amber-600',
    suffix: '',
    getValue: (d: DashboardData) => d.summary.individualTasks.completed + d.summary.teamTasks.completed,
  },
  {
    key: 'overdueTasks',
    label: 'Task trễ hạn',
    icon: WarningCircle,
    gradient: 'from-rose-400 to-red-500',
    bg: 'bg-rose-50',
    textColor: 'text-rose-600',
    suffix: '',
    getValue: (d: DashboardData) => d.summary.individualTasks.overdue + d.summary.teamTasks.overdue,
  },
  {
    key: 'totalTasks',
    label: 'Tổng số task',
    icon: TrendUp,
    gradient: 'from-cyan-400 to-sky-500',
    bg: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    suffix: '',
    getValue: (d: DashboardData) => d.summary.individualTasks.total + d.summary.teamTasks.total,
  },
];

interface Props { data: DashboardData; }

export const KPICards = memo(function KPICards({ data }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {KPI_CONFIG.map((kpi) => {
        const Icon = kpi.icon;
        const value = kpi.getValue(data);
        return (
          <div
            key={kpi.key}
            className="relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group"
          >
            {/* Gradient accent top bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.gradient} rounded-t-2xl`} />

            <div className={`inline-flex p-2.5 rounded-xl ${kpi.bg} mb-3`}>
              <Icon className={`w-5 h-5 ${kpi.textColor}`} weight="bold" />
            </div>

            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-tight mb-1">
              {kpi.label}
            </p>
            <p className={`text-3xl font-black ${kpi.textColor} tabular-nums leading-none`}>
              {value}
              <span className="text-base font-bold ml-0.5">{kpi.suffix}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
});
