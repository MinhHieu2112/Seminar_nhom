// Course and Lesson Types
export interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  type: 'video' | 'document' | 'quiz'
  content: {
    videoUrl?: string
    documentUrl?: string
    quizData?: QuizQuestion[]
  }
  duration: number // minutes
  isLocked: boolean
  prerequisites?: string[] // lesson IDs
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: {
    id: string
    name: string
    avatar: string
  }
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  totalLessons: number
  totalDuration: number // minutes
  rating: number
  enrolledCount: number
  price: number | null
  isPaid: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CourseProgress {
  userId: string
  courseId: string
  lessonProgress: LessonProgress[]
  completedAt?: string
  progressPercentage: number
}

export interface LessonProgress {
  lessonId: string
  completed: boolean
  completedAt?: string
  watchedDuration?: number // for videos
  startedAt: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  enrolledCourses: string[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter and Search Types
export interface CourseFilters {
  category?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  priceRange?: {
    min: number
    max: number
  }
  rating?: number
  searchQuery?: string
  page?: number
  pageSize?: number
  sortBy?: 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
}
