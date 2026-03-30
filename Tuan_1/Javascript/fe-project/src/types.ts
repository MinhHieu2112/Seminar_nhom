export interface Item {
  id: number
  name: string
  description?: string
  price?: number
  created_at: string
}

export interface ItemCreate {
  name: string
  description?: string
  price?: number
}

export interface RootResponse {
  app: string
  version: string
  message: string
}

export interface HealthCheckDetail {
  name: string
  status: string
  details?: string
}

export interface HealthResponse {
  status: string
  uptime_seconds: number
  timestamp: string
  checks: HealthCheckDetail[]
}

// Learning Profile Types
export type CurrentLevel = 'beginner' | 'intermediate' | 'advanced'
export type TargetLanguage = 'Python' | 'JavaScript' | 'Java' | 'C#'
export type DailyTimeGoal = 60 | 120 | 180

export interface LearningProfile {
  user_id: number
  current_level: CurrentLevel
  goal: string // e.g., 'web', 'backend', 'algorithm', 'interview', 'project'
  target_language_id: number
  target_language?: TargetLanguage
  daily_time_goal_minutes: DailyTimeGoal
  deadline_goal?: string | null
  created_at?: string
  updated_at?: string
}

export interface LearningProfileCreate {
  current_level: CurrentLevel
  goal: string
  target_language_id: number
  daily_time_goal_minutes: DailyTimeGoal
  deadline_goal?: string | null
}

export interface Language {
  id: number
  name: TargetLanguage
  judge0_id: number
  is_active: boolean
}

export interface OnboardingState {
  currentStep: number // 0-3 for 4-step process
  currentLevel: CurrentLevel | ''
  targetLanguage: number | ''
  dailyTimeGoal: DailyTimeGoal | ''
  deadlineGoal: string | null
}
