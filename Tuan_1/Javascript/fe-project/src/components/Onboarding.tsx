import { useState, useEffect } from 'react'
import { CurrentLevel, DailyTimeGoal, OnboardingState, Language } from '../types'
import { getLanguages, createLearningProfile } from '../api'
import './Onboarding.css'

interface OnboardingProps {
  userId: number
  onComplete: () => void
}

export function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    currentLevel: '',
    targetLanguage: '',
    dailyTimeGoal: '',
    deadlineGoal: null,
  })

  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadLanguages()
  }, [])

  const loadLanguages = async () => {
    try {
      setLoading(true)
      const data = await getLanguages()
      setLanguages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load languages')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (!isStepValid()) {
      setError(getStepValidationMessage())
      return
    }
    setError(null)
    setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }))
  }

  const handlePrev = () => {
    setError(null)
    setState((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))
  }

  const isStepValid = (): boolean => {
    switch (state.currentStep) {
      case 0:
        return state.currentLevel !== ''
      case 1:
        return state.targetLanguage !== ''
      case 2:
        return state.dailyTimeGoal !== ''
      case 3:
        return true
      default:
        return false
    }
  }

  const getStepValidationMessage = (): string => {
    switch (state.currentStep) {
      case 0:
        return 'Please select your current level'
      case 1:
        return 'Please select a target language'
      case 2:
        return 'Please select your daily study time'
      default:
        return 'Please complete this step'
    }
  }

  const handleSubmit = async () => {
    if (!isStepValid()) {
      setError(getStepValidationMessage())
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      await createLearningProfile(userId, {
        current_level: state.currentLevel as CurrentLevel,
        goal: 'learning', // Default goal, can be customized later
        target_language_id: state.targetLanguage as number,
        daily_time_goal_minutes: state.dailyTimeGoal as DailyTimeGoal,
        deadline_goal: state.deadlineGoal,
      })

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <p className="loading">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to Codex</h1>
          <p className="subtitle">Complete your learning profile to get started</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((state.currentStep + 1) / 4) * 100}%` }}
            ></div>
          </div>
          <p className="step-counter">
            Step {state.currentStep + 1} of 4
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="onboarding-content">
          {/* Step 0: Current Level */}
          {state.currentStep === 0 && (
            <div className="step-content">
              <div className="step-title">
                <h2>What's your current level?</h2>
              </div>
              <div className="level-options">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <label key={level} className="option-card">
                    <input
                      type="radio"
                      name="level"
                      value={level}
                      checked={state.currentLevel === level}
                      onChange={(e) => {
                        setState((prev) => ({
                          ...prev,
                          currentLevel: e.target.value as CurrentLevel,
                        }))
                        setError(null)
                      }}
                    />
                    <div className="option-content">
                      <span className="option-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                      <span className="option-description">
                        {level === 'beginner' && 'Just starting my coding journey'}
                        {level === 'intermediate' && 'I have some coding experience'}
                        {level === 'advanced' && 'I&apos;m experienced with coding'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Target Language */}
          {state.currentStep === 1 && (
            <div className="step-content">
              <div className="step-title">
                <h2>Which language do you want to learn?</h2>
              </div>
              <div className="language-options">
                {languages.map((lang) => (
                  <label key={lang.id} className="option-card">
                    <input
                      type="radio"
                      name="language"
                      value={lang.id}
                      checked={state.targetLanguage === lang.id}
                      onChange={(e) => {
                        setState((prev) => ({
                          ...prev,
                          targetLanguage: parseInt(e.target.value),
                        }))
                        setError(null)
                      }}
                    />
                    <div className="option-content">
                      <span className="option-label">{lang.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Daily Study Time */}
          {state.currentStep === 2 && (
            <div className="step-content">
              <div className="step-title">
                <h2>How much time can you dedicate daily?</h2>
              </div>
              <div className="time-options">
                {([60, 120, 180] as const).map((time) => (
                  <label key={time} className="option-card">
                    <input
                      type="radio"
                      name="time"
                      value={time}
                      checked={state.dailyTimeGoal === time}
                      onChange={(e) => {
                        setState((prev) => ({
                          ...prev,
                          dailyTimeGoal: parseInt(e.target.value) as DailyTimeGoal,
                        }))
                        setError(null)
                      }}
                    />
                    <div className="option-content">
                      <span className="option-label">{time} minutes</span>
                      <span className="option-description">
                        {time === 60 && '~1 hour per day'}
                        {time === 120 && '~2 hours per day'}
                        {time === 180 && '3+ hours per day'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review & Optional Deadline */}
          {state.currentStep === 3 && (
            <div className="step-content">
              <div className="step-title">
                <h2>Review your profile</h2>
              </div>
              <div className="summary-section">
                <div className="summary-item">
                  <span className="summary-label">Current Level:</span>
                  <span className="summary-value">
                    {state.currentLevel.charAt(0).toUpperCase() + state.currentLevel.slice(1)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Target Language:</span>
                  <span className="summary-value">
                    {languages.find((l) => l.id === state.targetLanguage)?.name}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Daily Study Time:</span>
                  <span className="summary-value">{state.dailyTimeGoal} minutes</span>
                </div>
              </div>

              <div className="deadline-section">
                <label htmlFor="deadline">Set a learning deadline (optional):</label>
                <input
                  type="date"
                  id="deadline"
                  value={state.deadlineGoal || ''}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      deadlineGoal: e.target.value || null,
                    }))
                  }
                  className="deadline-input"
                />
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          {state.currentStep > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={isSubmitting}
            >
              Previous
            </button>
          )}

          {state.currentStep < 3 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={isSubmitting || !isStepValid()}
            >
              Next
            </button>
          ) : (
            <button
              className="btn btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
