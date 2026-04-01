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
import { UserPlus, Mail, Lock, Eye, EyeOff, Github, Chrome, User } from 'lucide-react';

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      router.push('/auth/setup-learning-profile');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Top gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
      
      <CardHeader className="space-y-3 pt-8 pb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
          <CardDescription className="text-gray-500">
            Join thousands of learners on their coding journey
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
            <span className="px-4 bg-white/80 text-gray-400">Or sign up with email</span>
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
            <label htmlFor="username" className="text-sm font-semibold text-gray-700">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="username"
                placeholder="Choose a username"
                {...register('username')}
                className="h-12 pl-11 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-blue-200 rounded-xl transition-all"
                disabled={isLoading}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-500 font-medium">{errors.username.message}</p>
            )}
          </div>

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
            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
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
            <p className="text-xs text-gray-400">
              Must be at least 8 characters with 1 uppercase and 1 number
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-500">Already have an account?</span>{' '}
          <Link 
            href="/auth/sign-in" 
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </p>
      </CardContent>
    </Card>
  );
}
