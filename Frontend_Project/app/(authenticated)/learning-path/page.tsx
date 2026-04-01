'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { StatCard } from '@/components/shared/StatCard'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function LearningPathPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        if (!user?.id) return

        // Fetch user stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!statsError && statsData) {
          setStats(statsData)
        }

        // Prepare chart data
        setChartData([
          { name: 'Easy', completed: 5, total: 10 },
          { name: 'Medium', completed: 3, total: 8 },
          { name: 'Hard', completed: 1, total: 5 },
          { name: 'Courses', completed: 2, total: 4 },
        ])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Learning Path</h1>
          <p className="text-slate-400">Track your progress and build a consistent learning habit</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon="📊"
                label="Total Solved"
                value={stats?.total_solved || 0}
              />
              <StatCard
                icon="✅"
                label="Success Rate"
                value={`${stats?.success_rate || 0}%`}
              />
              <StatCard
                icon="🔥"
                label="Current Streak"
                value={`${stats?.current_streak || 0} days`}
              />
              <StatCard
                icon="🏆"
                label="Level"
                value={stats?.level || 'Beginner'}
              />
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Overall Progress</h2>
              <ProgressBar value={stats?.overall_progress || 0} />
            </div>

            {/* Chart */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Completion by Difficulty</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, '']}
                  />
                  <Bar dataKey="completed" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Plan */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Today's Plan</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700">
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                  <span className="text-slate-300">Solve 2 Easy Problems</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700">
                  <input type="checkbox" className="w-5 h-5" />
                  <span className="text-slate-300">Complete 1 Medium Problem</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700">
                  <input type="checkbox" className="w-5 h-5" />
                  <span className="text-slate-300">Watch 1 Course Lesson</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
