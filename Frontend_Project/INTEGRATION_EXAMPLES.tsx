/**
 * Integration Examples for Onboarding Feature
 * 
 * This file shows different ways to integrate the onboarding components
 * into your existing application architecture.
 */

// ============================================================
// Example 1: Firebase Authentication Integration
// ============================================================

import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './firebase-config'
import { Onboarding, UserProfile } from './components'

export function AppWithFirebase() {
  const [user, setUser] = useState<User | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        // Check if user has completed onboarding
        const response = await fetch(
          `${API_BASE_URL}/users/${firebaseUser.uid}/learning-profile`
        )
        if (response.ok) {
          setHasCompletedOnboarding(true)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div>
      {!hasCompletedOnboarding ? (
        <Onboarding
          userId={parseInt(user.uid)}
          onComplete={() => setHasCompletedOnboarding(true)}
        />
      ) : (
        <UserProfile userId={parseInt(user.uid)} />
      )}
    </div>
  )
}

// ============================================================
// Example 2: React Router Integration
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export function AppWithRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<Onboarding userId={1} onComplete={() => {}} />} />
        <Route path="/profile" element={<UserProfile userId={1} />} />
        <Route path="/" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

// ============================================================
// Example 3: Context API for Auth State
// ============================================================

import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  userId: number | null
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  return (
    <AuthContext.Provider
      value={{
        userId,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Usage:
function AppWithContext() {
  const { userId, hasCompletedOnboarding, setHasCompletedOnboarding } = useAuth()

  if (!userId) {
    return <LoginPage />
  }

  return (
    <>
      {!hasCompletedOnboarding ? (
        <Onboarding
          userId={userId}
          onComplete={() => setHasCompletedOnboarding(true)}
        />
      ) : (
        <UserProfile userId={userId} />
      )}
    </>
  )
}

// ============================================================
// Example 4: Next.js App Router Integration
// ============================================================

/*
// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Onboarding, UserProfile } from '@/components'

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <>
      {!hasCompletedOnboarding ? (
        <Onboarding
          userId={parseInt(session.user.id)}
          onComplete={() => setHasCompletedOnboarding(true)}
        />
      ) : (
        <UserProfile userId={parseInt(session.user.id)} />
      )}
    </>
  )
}
*/

// ============================================================
// Example 5: Redux Integration
// ============================================================

// userSlice.ts
/*
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  userId: number | null
  hasCompletedOnboarding: boolean
}

const initialState: UserState = {
  userId: null,
  hasCompletedOnboarding: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<number>) => {
      state.userId = action.payload
    },
    setOnboardingComplete: (state) => {
      state.hasCompletedOnboarding = true
    },
  },
})

export const { setUserId, setOnboardingComplete } = userSlice.actions
export default userSlice.reducer
*/

// Usage:
/*
function AppWithRedux() {
  const dispatch = useDispatch()
  const { userId, hasCompletedOnboarding } = useSelector(
    (state: RootState) => state.user
  )

  return (
    <>
      {!hasCompletedOnboarding ? (
        <Onboarding
          userId={userId}
          onComplete={() => dispatch(setOnboardingComplete())}
        />
      ) : (
        <UserProfile userId={userId} />
      )}
    </>
  )
}
*/

// ============================================================
// Example 6: Custom Hook for Onboarding Status
// ============================================================

function useOnboardingStatus(userId: number) {
  const [hasCompleted, setHasCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/users/${userId}/learning-profile`
        )
        if (response.ok) {
          setHasCompleted(true)
        } else {
          setHasCompleted(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error checking status')
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [userId])

  return { hasCompleted, loading, error }
}

// Usage:
function AppWithHook() {
  const { hasCompleted, loading } = useOnboardingStatus(1)

  if (loading) return <div>Checking status...</div>

  return (
    <>
      {!hasCompleted ? (
        <Onboarding userId={1} onComplete={() => {}} />
      ) : (
        <UserProfile userId={1} />
      )}
    </>
  )
}

// ============================================================
// Example 7: API Interceptor for Common Headers
// ============================================================

function createApiClient() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  return {
    async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
      const url = `${baseURL}${endpoint}`
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'API Error')
      }

      return response.json()
    },

    get<T>(endpoint: string) {
      return this.request<T>(endpoint, { method: 'GET' })
    },

    post<T>(endpoint: string, body: unknown) {
      return this.request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },

    put<T>(endpoint: string, body: unknown) {
      return this.request<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
    },
  }
}

const apiClient = createApiClient()

// ============================================================
// Example 8: Error Boundary Wrapper
// ============================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class OnboardingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Onboarding error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Onboarding Error</h2>
          <p>An error occurred during setup. Please try again.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage:
export function SafeApp() {
  return (
    <OnboardingErrorBoundary>
      <Onboarding userId={1} onComplete={() => {}} />
    </OnboardingErrorBoundary>
  )
}

// ============================================================
// Example 9: Environment-based Configuration
// ============================================================

const config = {
  development: {
    apiUrl: 'http://localhost:8000',
    mockData: true,
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL,
    mockData: false,
  },
  test: {
    apiUrl: 'http://localhost:3001',
    mockData: true,
  },
}

const environment = process.env.NODE_ENV as keyof typeof config
const APP_CONFIG = config[environment]

// ============================================================
// Example 10: Telemetry & Analytics
// ============================================================

export function trackOnboardingEvent(eventName: string, data?: unknown) {
  if (window.gtag) {
    window.gtag('event', eventName, data)
  }
}

// Usage in Onboarding component:
/*
const handleStepChange = (step: number) => {
  trackOnboardingEvent('onboarding_step_viewed', { step })
}

const handleSubmit = () => {
  trackOnboardingEvent('onboarding_completed', {
    level: state.currentLevel,
    language: state.targetLanguage,
    time: state.dailyTimeGoal
  })
}
*/

export {}
