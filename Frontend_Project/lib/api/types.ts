// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  status: number
  details?: Record<string, string[]>
}

// ============================================
// Problem Types
// ============================================

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Problem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  description: string
  examples: ProblemExample[]
  constraints: string[]
  hints: string[]
  starterCode: Record<string, string>
  testCases: TestCase[]
  topics: string[]
  companies: string[]
  acceptanceRate: number
  submissionCount: number
  xpReward: number
  isCompleted?: boolean
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isHidden: boolean
}

export interface ProblemFilters {
  difficulty?: Difficulty
  topics?: string[]
  status?: 'all' | 'completed' | 'attempted' | 'unattempted'
  search?: string
  page?: number
  limit?: number
}

// ============================================
// Submission Types
// ============================================

export type SubmissionStatus = 
  | 'pending' 
  | 'running' 
  | 'accepted' 
  | 'wrong_answer' 
  | 'time_limit_exceeded' 
  | 'memory_limit_exceeded' 
  | 'runtime_error' 
  | 'compilation_error'

export interface Submission {
  id: string
  problemId: string
  problemTitle: string
  userId: string
  code: string
  language: string
  status: SubmissionStatus
  runtime?: number
  memory?: number
  testCasesPassed: number
  totalTestCases: number
  errorMessage?: string
  xpEarned: number
  createdAt: string
}

export interface SubmissionResult {
  submissionId: string
  status: SubmissionStatus
  testResults: TestResult[]
  runtime?: number
  memory?: number
  xpEarned: number
}

export interface TestResult {
  testCaseId: string
  passed: boolean
  input: string
  expectedOutput: string
  actualOutput?: string
  error?: string
  runtime: number
}

export interface CreateSubmissionRequest {
  problemId: string
  code: string
  language: string
}

export interface SubmissionFilters {
  problemId?: string
  status?: SubmissionStatus
  language?: string
  page?: number
  limit?: number
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  level: number
  xp: number
  xpToNextLevel: number
  coins: number
  streak: number
  longestStreak: number
  rank: number
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  badges: Badge[]
  skills: UserSkill[]
  joinedAt: string
  lastActiveAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt: string
}

export interface UserSkill {
  topic: string
  problemsSolved: number
  proficiency: number // 0-100
}

export interface UserStats {
  totalSubmissions: number
  acceptedSubmissions: number
  acceptanceRate: number
  totalXpEarned: number
  currentStreak: number
  activeDays: number
  contestsParticipated: number
  globalRank: number
  contributionPoints: number
}

export interface UpdateProfileRequest {
  username?: string
  bio?: string
  avatar?: string
}

export interface ActivityHeatmap {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

// ============================================
// Reward Types
// ============================================

export interface Reward {
  id: string
  type: 'xp' | 'badge' | 'streak_bonus' | 'level_up' | 'achievement'
  amount?: number
  badge?: Badge
  achievement?: Achievement
  message: string
  earnedAt: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'problems' | 'streak' | 'social' | 'speed' | 'mastery'
  progress: number
  target: number
  isUnlocked: boolean
  xpReward: number
  unlockedAt?: string
}

export interface DailyChallenge {
  id: string
  problem: Problem
  bonusXp: number
  expiresAt: string
  isCompleted: boolean
}

export interface LeaderboardEntry {
  rank: number
  user: Pick<User, 'id' | 'username' | 'avatar' | 'level'>
  xp: number
  problemsSolved: number
  streak: number
}

export interface LeaderboardFilters {
  type: 'global' | 'weekly' | 'friends'
  page?: number
  limit?: number
}

// ============================================
// Minigame Types
// ============================================

export type MinigameType = 
  | 'code_race' 
  | 'bug_hunt' 
  | 'syntax_sprint' 
  | 'algorithm_arena' 
  | 'memory_match'

export interface Minigame {
  id: string
  type: MinigameType
  name: string
  description: string
  icon: string
  difficulty: Difficulty
  xpReward: number
  timeLimit: number // seconds
  highScore?: number
  playCount: number
  isUnlocked: boolean
  unlockRequirement?: string
}

export interface MinigameSession {
  id: string
  minigameId: string
  userId: string
  score: number
  timeSpent: number
  xpEarned: number
  isHighScore: boolean
  completedAt: string
}

export interface StartMinigameResponse {
  sessionId: string
  minigame: Minigame
  challenges: MinigameChallenge[]
  startedAt: string
}

export interface MinigameChallenge {
  id: string
  type: string
  question: string
  options?: string[]
  correctAnswer: string
  timeLimit: number
  points: number
}

export interface SubmitMinigameRequest {
  sessionId: string
  answers: MinigameAnswer[]
  timeSpent: number
}

export interface MinigameAnswer {
  challengeId: string
  answer: string
  timeSpent: number
}

export interface MinigameResult {
  sessionId: string
  score: number
  correctAnswers: number
  totalQuestions: number
  xpEarned: number
  isNewHighScore: boolean
  leaderboardRank?: number
}

export interface MinigameLeaderboard {
  minigameId: string
  entries: MinigameLeaderboardEntry[]
}

export interface MinigameLeaderboardEntry {
  rank: number
  user: Pick<User, 'id' | 'username' | 'avatar'>
  score: number
  playedAt: string
}

// ============================================
// Learning Path Types
// ============================================

export interface LearningPath {
  id: string
  title: string
  description: string
  icon: string
  difficulty: Difficulty
  estimatedHours: number
  totalProblems: number
  completedProblems: number
  modules: LearningModule[]
  isEnrolled: boolean
  progress: number
}

export interface LearningModule {
  id: string
  title: string
  description: string
  order: number
  problems: Problem[]
  isUnlocked: boolean
  isCompleted: boolean
}
