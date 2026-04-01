// API Client for Backend REST API
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get auth token from localStorage (set by authService after login)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipAuth = false, ...restConfig } = config;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...restConfig.headers,
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...restConfig,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response
    );
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// HTTP methods
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: 'GET' }),
    
  post: <T>(endpoint: string, body: unknown, config?: RequestConfig) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    }),
    
  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: 'DELETE' }),
};

export { ApiError, API_BASE_URL };
