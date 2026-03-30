'use client';

import { supabase } from '@/lib/supabase';

export const adminService = {
  // User management
  getUsers: async (limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  getUserCount: async () => {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  getUserDetail: async (userId: string) => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') throw statsError;

    return { user, stats };
  },

  updateUserRole: async (userId: string, role: 'USER' | 'ADMIN') => {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },

  // Analytics
  getAnalyticsDashboard: async () => {
    try {
      const totalUsersRes = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const totalCoursesRes = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      const totalSubmissionsRes = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      const acceptedRes = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACCEPTED');

      const totalUsers = totalUsersRes.count || 0;
      const totalCourses = totalCoursesRes.count || 0;
      const totalSubmissions = totalSubmissionsRes.count || 0;
      const acceptedSubmissions = acceptedRes.count || 0;

      return {
        totalUsers,
        totalCourses,
        totalSubmissions,
        successRate: totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) : 0,
        activeUsersToday: Math.floor(totalUsers * 0.3), // Estimated
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  // Forum moderation
  getForumThreads: async (limit = 20, offset = 0) => {
    const { data, error } = await supabase
      .from('forum_questions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  getForumThreadDetail: async (threadId: string) => {
    const { data: thread, error: threadError } = await supabase
      .from('forum_questions')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError) throw threadError;

    const { data: replies, error: repliesError } = await supabase
      .from('forum_answers')
      .select('*')
      .eq('question_id', threadId)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    return { thread, replies };
  },

  updateForumThreadStatus: async (threadId: string, status: string) => {
    const { error } = await supabase
      .from('forum_questions')
      .update({ status })
      .eq('id', threadId);

    if (error) throw error;
  },
};
