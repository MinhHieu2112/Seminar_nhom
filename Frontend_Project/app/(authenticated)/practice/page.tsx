'use client';

import { ExerciseCard } from '@/components/shared/ExerciseCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useState } from 'react';
import { useExercises } from '@/hooks/useExercises';
import { Skeleton } from '@/components/ui/skeleton';
import { ExerciseLevel } from '@/types/api-types';

const DIFFICULTIES: { value: ExerciseLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: ExerciseLevel.EASY, label: 'Easy' },
  { value: ExerciseLevel.MEDIUM, label: 'Medium' },
  { value: ExerciseLevel.HARD, label: 'Hard' },
];

const LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

export default function PracticePage() {
  const [difficulty, setDifficulty] = useState<ExerciseLevel | 'all'>('all');
  const [language, setLanguage] = useState('all');
  
  const filter = difficulty !== 'all' ? { difficulty } : undefined;
  const { data: exercises, isLoading, error } = useExercises(filter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon="⚠️"
            title="Error Loading Exercises"
            description="Failed to load exercises. Please try again later."
          />
        </div>
      </div>
    );
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
              onChange={(e) => setDifficulty(e.target.value as ExerciseLevel | 'all')}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!exercises || exercises.length === 0 ? (
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
                language={language !== 'all' ? language : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
