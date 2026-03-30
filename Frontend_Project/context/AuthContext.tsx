'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, LearningProfile, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase.auth) {
          console.warn('Supabase not initialized properly');
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch user profile from database
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && data) {
            setUser(data);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setUser(data);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (!authData.user) throw new Error('Failed to create user');

        // Create user profile
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email,
          username,
          role: 'USER',
        });

        if (profileError) throw profileError;

        // Fetch the created user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      throw error;
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

        if (error) throw error;
      } catch (error) {
        throw error;
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
