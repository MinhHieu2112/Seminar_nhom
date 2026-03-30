import { Course, Lesson, CourseProgress, ApiResponse, PaginatedResponse, CourseFilters } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        success: false,
        error: error.message || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Course APIs
export async function getCourses(filters?: CourseFilters): Promise<ApiResponse<PaginatedResponse<Course>>> {
  const params = new URLSearchParams()
  if (filters) {
    if (filters.searchQuery) params.append('search', filters.searchQuery)
    if (filters.category) params.append('category', filters.category)
    if (filters.level) params.append('level', filters.level)
    if (filters.sortBy) params.append('sort', filters.sortBy)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())
  }

  const queryString = params.toString()
  return apiCall<PaginatedResponse<Course>>(
    `/courses${queryString ? '?' + queryString : ''}`
  )
}

export async function getCourseById(courseId: string): Promise<ApiResponse<Course>> {
  return apiCall<Course>(`/courses/${courseId}`)
}

export async function getCourseLessons(courseId: string): Promise<ApiResponse<Lesson[]>> {
  return apiCall<Lesson[]>(`/courses/${courseId}/lessons`)
}

export async function enrollCourse(courseId: string): Promise<ApiResponse<{ success: boolean }>> {
  return apiCall(`/courses/${courseId}/enroll`, {
    method: 'POST',
  })
}

// Lesson APIs
export async function getLessonById(
  courseId: string,
  lessonId: string
): Promise<ApiResponse<Lesson>> {
  return apiCall<Lesson>(`/courses/${courseId}/lessons/${lessonId}`)
}

export async function markLessonComplete(
  courseId: string,
  lessonId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiCall(`/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: 'POST',
  })
}

// Progress APIs
export async function getCourseProgress(courseId: string): Promise<ApiResponse<CourseProgress>> {
  return apiCall<CourseProgress>(`/courses/${courseId}/progress`)
}

export async function updateLessonProgress(
  courseId: string,
  lessonId: string,
  watchedDuration?: number
): Promise<ApiResponse<{ success: boolean }>> {
  return apiCall(`/courses/${courseId}/lessons/${lessonId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ watchedDuration }),
  })
}

// Category APIs
export async function getCategories(): Promise<ApiResponse<string[]>> {
  return apiCall<string[]>(`/categories`)
}
