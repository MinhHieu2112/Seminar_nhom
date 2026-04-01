'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import type { User, LearningProfile, AuthContextType } from '@/types/api-types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          // Token exists, fetch user from backend
          const user = await authService.getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid token
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        // Sign up and store token (handled by authService)
        const user = await authService.signUp({ email, password, username });
        setUser(user);
      } catch (error) {
        // Clear any partial auth state
        authService.logout();
        setUser(null);
        throw error;
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Sign in and store token (handled by authService)
      const user = await authService.signIn({ email, password });
      setUser(user);
    } catch (error) {
      // Clear any partial auth state
      authService.logout();
      setUser(null);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const setupLearningProfile = useCallback(
    async (profile: Omit<LearningProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      try {
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase.from('learning_profiles').insert({
          user_id: user.id,
          ...profile,
        });

        if (error) {
          console.error('Supabase learning_profiles insert error:', error);
          // Extract meaningful error message from Supabase error
          const errorMessage =
            error.message ||
            error.details ||
            error.hint ||
            (typeof error === 'string' ? error : 'Failed to create learning profile');
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('setupLearningProfile error:', error);
        // Re-throw with extracted message
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(
          error?.message || error?.details || 'Failed to create learning profile'
        );
      }
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    setupLearningProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
