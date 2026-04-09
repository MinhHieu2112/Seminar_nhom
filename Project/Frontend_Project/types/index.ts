// User types
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface LearningProfile {
  id: string;
  user_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  learning_goal: 'get_job' | 'learn_hobby' | 'improve_skills' | 'prepare_interview';
  primary_language_id: string;
  daily_time_goal: number; // in minutes
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setupLearningProfile: (profile: Omit<LearningProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
