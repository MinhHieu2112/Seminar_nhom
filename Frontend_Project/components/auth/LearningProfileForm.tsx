'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { learningProfileSchema, type LearningProfileInput } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Language } from '@/types';

export function LearningProfileForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const router = useRouter();
  const { setupLearningProfile, user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LearningProfileInput>({
    resolver: zodResolver(learningProfileSchema),
    defaultValues: {
      daily_time_goal: 60,
    },
  });

  // Fetch languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('name');

        if (error) throw error;
        setLanguages(data || []);
      } catch (err) {
        console.error('Error fetching languages:', err);
        setError('Failed to load programming languages');
      }
    };

    fetchLanguages();
  }, []);

  const dailyTimeGoal = watch('daily_time_goal');

  const onSubmit = async (data: LearningProfileInput) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await setupLearningProfile(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to set up learning profile. Please try again.');
      console.error('Learning profile error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Customize Your Learning</CardTitle>
        <CardDescription>Let us tailor your learning experience</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Proficiency Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              Your Current Level
            </label>
            <div className="space-y-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <label key={level} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={level}
                    {...register('proficiency_level')}
                    className="w-4 h-4 text-purple-600 accent-purple-600"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-300 capitalize">{level}</span>
                </label>
              ))}
            </div>
            {errors.proficiency_level && (
              <p className="text-xs text-red-400">{errors.proficiency_level.message}</p>
            )}
          </div>

          {/* Learning Goal */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              What&apos;s Your Goal?
            </label>
            <div className="space-y-2">
              {[
                { value: 'get_job', label: 'Get a job' },
                { value: 'learn_hobby', label: 'Learn as a hobby' },
                { value: 'improve_skills', label: 'Improve existing skills' },
                { value: 'prepare_interview', label: 'Prepare for interviews' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={value}
                    {...register('learning_goal')}
                    className="w-4 h-4 text-purple-600 accent-purple-600"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
            {errors.learning_goal && (
              <p className="text-xs text-red-400">{errors.learning_goal.message}</p>
            )}
          </div>

          {/* Programming Language */}
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium text-gray-300">
              Primary Programming Language
            </label>
            <select
              id="language"
              {...register('primary_language_id')}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
              disabled={isLoading}
            >
              <option value="">Select a language</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            {errors.primary_language_id && (
              <p className="text-xs text-red-400">{errors.primary_language_id.message}</p>
            )}
          </div>

          {/* Daily Time Goal */}
          <div className="space-y-3">
            <label htmlFor="time" className="text-sm font-medium text-gray-300">
              Daily Learning Time Goal: {dailyTimeGoal} minutes
            </label>
            <input
              id="time"
              type="range"
              min="15"
              max="480"
              step="15"
              {...register('daily_time_goal', {
                valueAsNumber: true,
              })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400">
              {dailyTimeGoal < 60 ? 'Quick sessions' : dailyTimeGoal < 120 ? 'Moderate pace' : 'Intensive learning'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Setting Up...' : 'Get Started'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
