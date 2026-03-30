'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setError(null);
    setIsLoading(true);

    try {
      await signUp(data.email, data.password, data.username);
      // Redirect to learning profile setup
      router.push('/auth/setup-learning-profile');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
        <CardDescription>Join Codex and start learning to code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-300">
              Username
            </label>
            <Input
              id="username"
              placeholder="codepro2024"
              {...register('username')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-xs text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
            <p className="text-xs text-slate-400">
              Min 8 chars, 1 uppercase, 1 number
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
