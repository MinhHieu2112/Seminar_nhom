'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ icon, label, value, change }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-purple-500 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-white text-2xl font-bold mt-2">{value}</p>
          {change && (
            <p className={`text-xs mt-2 ${change.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {change.isPositive ? '+' : ''}{change.value}% from last month
            </p>
          )}
        </div>
        <div className="text-purple-400 opacity-70">{icon}</div>
      </div>
    </div>
  )
}
