'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { EmptyState } from '@/components/shared/EmptyState'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase.from('mini_projects').select('*')

        if (error) throw error
        setProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mini Projects</h1>
          <p className="text-gray-500">Build real-world projects step by step</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="No Projects Yet"
            description="Come back soon for exciting mini projects!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Stages: {project.stages_count || 0}</span>
                    <div className="text-blue-600">→</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
