// Types aligned with Backend DTOs and Database Schema

// ==================== ENUMS ====================
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum ExerciseLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum SubmissionStatus {
  QUEUED = 'QUEUED',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

export enum ForumEntityType {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

export enum VoteType {
  UPVOTE = 1,
  DOWNVOTE = -1,
}

export enum AnalyticsPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum CourseStatusFilter {
  ALL = 'all',
  ENROLLED = 'enrolled',
  NOT_ENROLLED = 'not-enrolled',
}

// ==================== USER TYPES ====================
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  user_id: string;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  current_streak: number;
  max_streak: number;
  global_rank?: number;
  last_submission_at?: string;
  lessons_completed: number;
  exercises_solved: number;
  projects_completed: number;
}

export interface UserSummary {
  user: User;
  stats: UserStats;
  enrolledCourses: number;
  completedLessons: number;
  submissionsCount: number;
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

// ==================== AUTH TYPES ====================
export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setupLearningProfile: (profile: Omit<LearningProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

// ==================== COURSE TYPES ====================
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CourseLevel;
  thumbnail_url?: string;
  progress?: number;
  enrolled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends Course {
  lessons_count: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content_type: string;
  content_url?: string;
  lesson_order: number;
  is_locked?: boolean;
  is_completed?: boolean;
  watched_duration_sec?: number;
  created_at: string;
  updated_at: string;
}

export interface LessonDetail extends Lesson {
  next_lesson_id?: string;
  previous_lesson_id?: string;
}

export interface UpdateLessonProgressRequest {
  watched_duration_sec?: number;
  completed?: boolean;
}

export interface UpdateLessonProgressResponse {
  success: boolean;
}

export interface EnrollCourseResponse {
  success: boolean;
  message: string;
}

export interface CourseFilter {
  difficulty?: CourseLevel;
  category?: string;
  status?: CourseStatusFilter;
  q?: string;
}

// ==================== EXERCISE TYPES ====================
export interface Language {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export interface TestCase {
  id: string;
  exercise_id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  order_index: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: ExerciseLevel;
  language_id: string;
  lesson_id?: string;
  starter_code?: string;
  solution_code?: string;
  time_limit_sec?: number;
  memory_limit_mb?: number;
  created_at: string;
  updated_at: string;
  language?: Language;
}

export interface ExerciseDetail extends Exercise {
  test_cases: TestCase[];
}

export interface ExerciseFilter {
  difficulty?: ExerciseLevel;
  lesson_id?: string;
}

// ==================== SUBMISSION TYPES ====================
export interface Submission {
  id: string;
  user_id: string;
  exercise_id: string;
  language_id: string;
  submitted_code: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

export interface SubmissionResult {
  id: string;
  submission_id: string;
  test_case_id: string;
  passed: boolean;
  actual_output?: string;
  execution_time_ms?: number;
  memory_used_mb?: number;
  error_message?: string;
  created_at: string;
}

export interface SubmissionWithResults extends Submission {
  submission_results?: SubmissionResult[];
}

export interface CreateSubmissionRequest {
  language_id: string;
  submitted_code: string;
}

// ==================== PROJECT TYPES ====================
export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: CourseLevel;
  thumbnail_url?: string;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectStage {
  id: string;
  project_id: string;
  title: string;
  description: string;
  stage_order: number;
  starter_code?: string;
  solution_code?: string;
  validation_rules?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectSubmission {
  id: string;
  user_id: string;
  stage_id: string;
  submitted_code_url?: string;
  version_number: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

// ==================== FORUM TYPES ====================
export interface ForumQuestion {
  id: string;
  user_id: string;
  lesson_id?: string;
  title: string;
  content: string;
  view_count: number;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  answer_count?: number;
  accepted_answer_id?: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
  };
  vote_score?: number;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  lesson_id?: string;
}

export interface CreateAnswerRequest {
  content: string;
}

export interface VoteRequest {
  vote_type: VoteType;
}

export interface VoteResponse {
  id: string;
  entity_type: ForumEntityType;
  entity_id: string;
  vote_type: number;
  created_at: string;
}

export interface QuestionFilter {
  lesson_id?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'most_viewed' | 'most_answered';
}

// ==================== ANALYTICS TYPES ====================
export interface AnalyticsRequest {
  period?: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
}

export interface LessonStats {
  lesson_id: string;
  lesson_title: string;
  completed_count: number;
  total_enrolled: number;
  completion_rate: number;
}

export interface ExerciseStats {
  exercise_id: string;
  exercise_title: string;
  total_submissions: number;
  accepted_submissions: number;
  acceptance_rate: number;
  difficulty?: string;
}

export interface ProjectStats {
  project_id: string;
  project_title: string;
  total_submissions: number;
  passed_submissions: number;
  success_rate: number;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  lessons_completed: number;
  exercises_solved: number;
  projects_completed: number;
  user_stats?: UserStats;
  top_lessons?: LessonStats[];
  top_exercises?: ExerciseStats[];
  top_projects?: ProjectStats[];
}

// ==================== ADMIN TYPES ====================
export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalSubmissions: number;
  successRate: string | number;
  activeUsersToday: number;
}

export interface UserWithStats {
  user: User;
  stats?: UserStats;
}
