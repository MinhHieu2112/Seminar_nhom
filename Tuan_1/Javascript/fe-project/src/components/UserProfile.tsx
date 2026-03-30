import { useState, useEffect } from 'react'
import { LearningProfile, Language, CurrentLevel, DailyTimeGoal } from '../types'
import { getLearningProfile, getLanguages, updateLearningProfile } from '../api'
import './UserProfile.css'

interface UserProfileProps {
  userId: number
}

export function UserProfile({ userId }: UserProfileProps) {
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    current_level: '' as CurrentLevel | '',
    target_language_id: 0,
    daily_time_goal_minutes: '' as DailyTimeGoal | '',
    deadline_goal: null as string | null,
  })

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [profileData, languagesData] = await Promise.all([
        getLearningProfile(userId),
        getLanguages(),
      ])

      if (!profileData) {
        setError('No learning profile found. Please complete onboarding first.')
      } else {
        setProfile(profileData)
        setEditForm({
          current_level: profileData.current_level,
          target_language_id: profileData.target_language_id,
          daily_time_goal_minutes: profileData.daily_time_goal_minutes,
          deadline_goal: profileData.deadline_goal || null,
        })
      }

      setLanguages(languagesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profile) {
      setEditForm({
        current_level: profile.current_level,
        target_language_id: profile.target_language_id,
        daily_time_goal_minutes: profile.daily_time_goal_minutes,
        deadline_goal: profile.deadline_goal || null,
      })
    }
    setError(null)
  }

  const validateForm = (): boolean => {
    if (!editForm.current_level) {
      setError('Please select your current level')
      return false
    }
    if (!editForm.target_language_id) {
      setError('Please select a target language')
      return false
    }
    if (!editForm.daily_time_goal_minutes) {
      setError('Please select your daily study time')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updatedProfile = await updateLearningProfile(userId, {
        current_level: editForm.current_level as CurrentLevel,
        goal: profile?.goal || 'learning',
        target_language_id: editForm.target_language_id,
        daily_time_goal_minutes: editForm.daily_time_goal_minutes as DailyTimeGoal,
        deadline_goal: editForm.deadline_goal,
      })

      setProfile(updatedProfile)
      setIsEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p className="loading">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="error-state">
            <h2>No Learning Profile</h2>
            <p>Complete the onboarding to set up your learning profile.</p>
          </div>
        </div>
      </div>
    )
  }

  const currentLanguage = languages.find((l) => l.id === profile.target_language_id)

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h1>Your Learning Profile</h1>
            <p className="profile-subtitle">
              Manage your learning goals and preferences
            </p>
          </div>
          {!isEditing && (
            <button className="btn-edit" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {isEditing ? (
          <div className="profile-form">
            {/* Current Level Edit */}
            <div className="form-section">
              <label className="form-label">Current Level</label>
              <div className="form-options">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <label key={level} className="form-option">
                    <input
                      type="radio"
                      name="level"
                      value={level}
                      checked={editForm.current_level === level}
                      onChange={(e) => {
                        setEditForm((prev) => ({
                          ...prev,
                          current_level: e.target.value as CurrentLevel,
                        }))
                        setError(null)
                      }}
                    />
                    <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Language Edit */}
            <div className="form-section">
              <label htmlFor="language" className="form-label">
                Target Language
              </label>
              <select
                id="language"
                value={editForm.target_language_id}
                onChange={(e) => {
                  setEditForm((prev) => ({
                    ...prev,
                    target_language_id: parseInt(e.target.value),
                  }))
                  setError(null)
                }}
                className="form-select"
              >
                <option value="">Select a language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Study Time Edit */}
            <div className="form-section">
              <label className="form-label">Daily Study Time</label>
              <div className="form-options">
                {([60, 120, 180] as const).map((time) => (
                  <label key={time} className="form-option">
                    <input
                      type="radio"
                      name="time"
                      value={time}
                      checked={editForm.daily_time_goal_minutes === time}
                      onChange={(e) => {
                        setEditForm((prev) => ({
                          ...prev,
                          daily_time_goal_minutes: parseInt(
                            e.target.value
                          ) as DailyTimeGoal,
                        }))
                        setError(null)
                      }}
                    />
                    <span>{time} minutes</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Deadline Edit */}
            <div className="form-section">
              <label htmlFor="deadline" className="form-label">
                Learning Deadline (optional)
              </label>
              <input
                type="date"
                id="deadline"
                value={editForm.deadline_goal || ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    deadline_goal: e.target.value || null,
                  }))
                }
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-display">
            {/* Profile Info Grid */}
            <div className="info-grid">
              <div className="info-card">
                <span className="info-label">Current Level</span>
                <span className="info-value">
                  {profile.current_level.charAt(0).toUpperCase() +
                    profile.current_level.slice(1)}
                </span>
              </div>

              <div className="info-card">
                <span className="info-label">Target Language</span>
                <span className="info-value">{currentLanguage?.name || 'Unknown'}</span>
              </div>

              <div className="info-card">
                <span className="info-label">Daily Study Time</span>
                <span className="info-value">{profile.daily_time_goal_minutes} min</span>
              </div>

              {profile.deadline_goal && (
                <div className="info-card">
                  <span className="info-label">Learning Deadline</span>
                  <span className="info-value">
                    {new Date(profile.deadline_goal).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Stats */}
            <div className="profile-stats">
              <h3>Profile Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Created</span>
                  <span className="stat-value">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Last Updated</span>
                  <span className="stat-value">
                    {profile.updated_at
                      ? new Date(profile.updated_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
