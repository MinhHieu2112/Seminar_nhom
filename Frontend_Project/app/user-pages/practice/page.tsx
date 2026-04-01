'use client'

import { ExerciseCard } from '@/components/shared/ExerciseCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PracticePage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [language, setLanguage] = useState<'all' | 'python' | 'javascript' | 'java' | 'cpp'>('all')
  const [languageLabel, setLanguageLabel] = useState<string>('')

  useEffect(() => {
    fetchExercises()
  }, [difficulty, language])

  async function fetchExercises() {
    try {
      setLoading(true)
      let query = supabase.from('exercises').select('*')

      if (difficulty !== 'all') {
        query = query.eq('difficulty', difficulty)
      }

      // exercises schema uses `language_id`; map UI language label -> language.id
      if (language !== 'all') {
        setLanguageLabel(language)

        const { data: langRow, error: langError } = await supabase
          .from('languages')
          .select('id,name')
          .ilike('name', `%${language}%`)
          .limit(1)
          .single()

        if (!langError && langRow?.id) {
          query = query.eq('language_id', langRow.id)
        }
      } else {
        setLanguageLabel('')
      }

      const { data, error } = await query

      if (error) throw error
      setExercises(data || [])
    } catch (error) {
      console.error('Error fetching exercises:', error)
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Practice</h1>
          <p className="text-slate-400">Solve coding challenges and improve your skills</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : exercises.length === 0 ? (
          <EmptyState
            icon="💻"
            title="No Exercises Found"
            description="Try adjusting your filters or check back later"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                id={exercise.id}
                title={exercise.title}
                description={exercise.description}
                difficulty={exercise.difficulty}
                acceptanceRate={0}
                language={languageLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
