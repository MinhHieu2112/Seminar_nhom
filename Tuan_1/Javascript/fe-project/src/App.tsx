import { useState } from 'react'
import { Onboarding, UserProfile } from './components'
import './App.css'

function App() {
  // In a real app, this would come from Firebase/auth context
  const [currentUser, setCurrentUser] = useState<{
    id: number
    hasCompletedOnboarding: boolean
  } | null>(null)

  const handleOnboardingComplete = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, hasCompletedOnboarding: true })
    }
  }

  // Demo: Simulate user login
  const simulateLogin = () => {
    setCurrentUser({
      id: 1, // Mock user ID (from Firebase/Auth)
      hasCompletedOnboarding: false,
    })
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  if (!currentUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Codex - Code Learning Platform</h1>
          <p>Learn to code with AI-powered feedback</p>
          <button className="btn-login" onClick={simulateLogin}>
            Simulate Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>Codex</h1>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {!currentUser.hasCompletedOnboarding ? (
        <Onboarding userId={currentUser.id} onComplete={handleOnboardingComplete} />
      ) : (
        <UserProfile userId={currentUser.id} />
      )}
    </div>
  )
}

export default App
