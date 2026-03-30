'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ForumPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })

  useEffect(() => {
    fetchThreads()
  }, [])

  async function fetchThreads() {
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select('*, forum_replies(count)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setThreads(data || [])
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateThread(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !formData.title.trim()) return

    try {
      const { error } = await supabase.from('forum_threads').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setFormData({ title: '', description: '' })
      setShowCreateForm(false)
      fetchThreads()
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Forum</h1>
          <p className="text-slate-400">Ask questions and share knowledge with the community</p>
        </div>

        {user && (
          <div className="mb-8">
            {!showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)}>Create New Thread</Button>
            ) : (
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-4">Create New Thread</h2>
                <form onSubmit={handleCreateThread}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                      placeholder="What's your question?"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 h-32 focus:outline-none focus:border-purple-500 resize-none"
                      placeholder="Provide more details..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Post
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : threads.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No Threads Yet"
            description="Be the first to start a discussion!"
          />
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/forum/${thread.id}`}>
                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-purple-500 transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold text-white hover:text-purple-400 mb-2">
                    {thread.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{thread.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-slate-400">
                      {thread.forum_replies?.[0]?.count || 0} replies
                    </span>
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
