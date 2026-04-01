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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

        // Create user via backend (which creates Supabase auth user + public_users row)
        const res = await fetch(`${backendUrl}/auth/sign-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, username }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || 'Failed to create account');
        }

        // Ensure Supabase client has a session for RLS-protected queries
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Fetch the created user record from public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (userError) throw userError;
        if (userData) {
          setUser(userData as User);
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Cập nhật User ngay lập tức trước khi trả về kết quả cho Form
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        
        if (profile) {
          setUser(profile); // Ép state cập nhật ngay
        }
      }
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
