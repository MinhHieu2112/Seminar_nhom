import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig,
  InternalAxiosRequestConfig 
} from 'axios'
import type { ApiError } from './types'

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const REQUEST_TIMEOUT = 30000 // 30 seconds

// ============================================
// Token Management
// ============================================

let accessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
  }
}

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token')
  }
  return accessToken
}

export const clearTokens = () => {
  accessToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

// ============================================
// Axios Instance
// ============================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================
// Request Interceptor
// ============================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// ============================================
// Response Interceptor
// ============================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Attempt to refresh token
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null
        
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          
          const { accessToken: newToken } = response.data
          setAccessToken(newToken)
          
          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return apiClient(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    
    // Transform error to consistent format
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    }
    
    return Promise.reject(apiError)
  }
)

// ============================================
// Request Helpers
// ============================================

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(res => res.data),
    
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
    
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
    
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(res => res.data),
}

export default apiClient
