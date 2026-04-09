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
  const { setupLearningProfile, user, loading: authLoading } = useAuth();

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

        if (error) {
          console.error('Supabase languages select error:', error);
          // Extract meaningful error message
          const errorMessage = error.message
            || error.details
            || error.hint
            || (typeof error === 'string' ? error : 'Failed to load programming languages');
          setError(errorMessage);
        } else {
          setLanguages(data || []);
        }
      } catch (err: any) {
        console.error('Error fetching languages:', err);
        // Re-throw with extracted message
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(err?.message || err?.details || 'Failed to load programming languages');
        }
      }
    };

    fetchLanguages();
  }, []);

  const dailyTimeGoal = watch('daily_time_goal');

  const onSubmit = async (data: LearningProfileInput) => {
    setError(null);

    // Wait for auth to be ready
    if (authLoading) {
      setError('Checking authentication... Please wait.');
      return;
    }

    // Now check if user is authenticated
    if (!user) {
      setError('User not authenticated. Please sign in first.');
      return;
    }

    setIsLoading(true);

    try {
      await setupLearningProfile(data);
      router.push('/dashboard');
    } catch (err: any) {
      // Extract error message from various error formats
      let errorMessage = 'Failed to set up learning profile. Please try again.';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && Object.keys(err).length > 0) {
        // Log the full error for debugging
        console.error('Learning profile error object:', JSON.stringify(err, null, 2));
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      setError(errorMessage);
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

          {/* Authentication Loading State */}
          {authLoading && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-md p-3 text-sm text-blue-400 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking authentication...
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
                    disabled={isLoading || authLoading}
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
                    disabled={isLoading || authLoading}
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
              disabled={isLoading || authLoading}
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
              disabled={isLoading || authLoading}
            />
            <p className="text-xs text-slate-400">
              {dailyTimeGoal < 60 ? 'Quick sessions' : dailyTimeGoal < 120 ? 'Moderate pace' : 'Intensive learning'}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading || authLoading}
          >
            {authLoading ? 'Checking Auth...' : isLoading ? 'Setting Up...' : 'Get Started'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
