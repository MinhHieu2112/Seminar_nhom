import type { 
  ProblemFilters, 
  SubmissionFilters, 
  LeaderboardFilters 
} from './types'

// ============================================
// Query Key Factory
// ============================================

export const queryKeys = {
  // Problems
  problems: {
    all: ['problems'] as const,
    lists: () => [...queryKeys.problems.all, 'list'] as const,
    list: (filters: ProblemFilters) => [...queryKeys.problems.lists(), filters] as const,
    details: () => [...queryKeys.problems.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.problems.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.problems.all, 'slug', slug] as const,
    topics: () => [...queryKeys.problems.all, 'topics'] as const,
    daily: () => [...queryKeys.problems.all, 'daily'] as const,
  },

  // Submissions
  submissions: {
    all: ['submissions'] as const,
    lists: () => [...queryKeys.submissions.all, 'list'] as const,
    list: (filters: SubmissionFilters) => [...queryKeys.submissions.lists(), filters] as const,
    details: () => [...queryKeys.submissions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.submissions.details(), id] as const,
    byProblem: (problemId: string) => [...queryKeys.submissions.all, 'problem', problemId] as const,
    recent: () => [...queryKeys.submissions.all, 'recent'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'me'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    stats: (id: string) => [...queryKeys.users.all, 'stats', id] as const,
    activity: (id: string) => [...queryKeys.users.all, 'activity', id] as const,
    heatmap: (id: string) => [...queryKeys.users.all, 'heatmap', id] as const,
  },

  // Rewards
  rewards: {
    all: ['rewards'] as const,
    achievements: () => [...queryKeys.rewards.all, 'achievements'] as const,
    badges: () => [...queryKeys.rewards.all, 'badges'] as const,
    leaderboard: (filters: LeaderboardFilters) => [...queryKeys.rewards.all, 'leaderboard', filters] as const,
    dailyChallenge: () => [...queryKeys.rewards.all, 'daily-challenge'] as const,
    streak: () => [...queryKeys.rewards.all, 'streak'] as const,
  },

  // Minigames
  minigames: {
    all: ['minigames'] as const,
    lists: () => [...queryKeys.minigames.all, 'list'] as const,
    details: () => [...queryKeys.minigames.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.minigames.details(), id] as const,
    session: (sessionId: string) => [...queryKeys.minigames.all, 'session', sessionId] as const,
    leaderboard: (minigameId: string) => [...queryKeys.minigames.all, 'leaderboard', minigameId] as const,
    history: () => [...queryKeys.minigames.all, 'history'] as const,
  },

  // Learning Paths
  learningPaths: {
    all: ['learning-paths'] as const,
    lists: () => [...queryKeys.learningPaths.all, 'list'] as const,
    details: () => [...queryKeys.learningPaths.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.learningPaths.details(), id] as const,
    enrolled: () => [...queryKeys.learningPaths.all, 'enrolled'] as const,
    progress: (id: string) => [...queryKeys.learningPaths.all, 'progress', id] as const,
  },
} as const

export type QueryKeys = typeof queryKeys
