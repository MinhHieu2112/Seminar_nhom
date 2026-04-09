'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Github, Chrome } from 'lucide-react';

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setError(null);
    setIsLoading(true);

    try {
      await signIn(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Top gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <CardHeader className="space-y-3 pt-8 pb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-gray-500">
            Sign in to continue your learning journey
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            type="button"
          >
            <Chrome className="w-5 h-5 mr-2 text-red-500" />
            <span className="text-gray-700 font-medium">Google</span>
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            type="button"
          >
            <Github className="w-5 h-5 mr-2 text-gray-900" />
            <span className="text-gray-700 font-medium">GitHub</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/80 text-gray-400">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="h-12 pl-11 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-blue-200 rounded-xl transition-all"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                className="h-12 pl-11 pr-11 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-blue-200 rounded-xl transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-500">Don&apos;t have an account?</span>{' '}
          <Link 
            href="/auth/sign-up" 
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
