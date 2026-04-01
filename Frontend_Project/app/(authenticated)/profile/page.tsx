'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { StatCard } from '@/components/shared/StatCard'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return

      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        // Fetch user stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setStats(statsData)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile?.username || 'User'}</h1>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-gray-500 mt-2">Joined {new Date(profile?.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-gray-700">{profile.bio}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="✅"
            label="Problems Solved"
            value={stats?.total_solved || 0}
          />
          <StatCard
            icon="📚"
            label="Courses Completed"
            value={stats?.courses_completed || 0}
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

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {['Python', 'JavaScript', 'React', 'Algorithms', 'Data Structures'].map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
