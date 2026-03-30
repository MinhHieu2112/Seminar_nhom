# Codex Onboarding Feature Documentation

## Overview

This document describes the implementation of the **onboarding feature** for the Codex code learning platform. The onboarding flow allows new users to complete their learning profile after signup, personalizing their learning journey based on their current level, target language, and study availability.

## Features Implemented

### 1. User Registration Completion Flow
- **4-step guided process** that walks users through profile creation
- **Progress indicator** showing current step and overall completion
- **Smooth transitions** between steps with validation

### 2. Learning Profile Creation
Users set up their learning preferences:
- **Current Level**: beginner, intermediate, or advanced
- **Target Language**: Python, JavaScript, Java, or C#
- **Daily Study Time**: 60, 120, or 180 minutes per day
- **Learning Deadline**: Optional deadline goal

### 3. Profile Viewing & Editing
- **User Profile Page** to view and edit learning profile
- **Easy profile updates** with validation and error handling
- **Profile statistics** showing creation and last update dates

## Project Structure

```
src/
├── components/
│   ├── Onboarding.tsx          # Main onboarding component
│   ├── Onboarding.css          # Onboarding styles
│   ├── UserProfile.tsx         # Profile viewing/editing component
│   ├── UserProfile.css         # Profile styles
│   └── index.ts                # Component exports
├── types.ts                    # TypeScript interfaces and types
├── api.ts                      # API functions for backend communication
├── App.tsx                     # Main app component with routing logic
└── App.css                     # App styles
```

## TypeScript Data Contracts

### Learning Profile Types

```typescript
type CurrentLevel = 'beginner' | 'intermediate' | 'advanced'
type TargetLanguage = 'Python' | 'JavaScript' | 'Java' | 'C#'
type DailyTimeGoal = 60 | 120 | 180

interface LearningProfile {
  user_id: number
  current_level: CurrentLevel
  goal: string
  target_language_id: number
  target_language?: TargetLanguage
  daily_time_goal_minutes: DailyTimeGoal
  deadline_goal?: string | null
  created_at?: string
  updated_at?: string
}

interface LearningProfileCreate {
  current_level: CurrentLevel
  goal: string
  target_language_id: number
  daily_time_goal_minutes: DailyTimeGoal
  deadline_goal?: string | null
}
```

## API Endpoints (Placeholders)

The following API endpoints are called by the frontend:

### Get Languages
```
GET /languages
Returns: Language[]
```

### Get Learning Profile
```
GET /users/:userId/learning-profile
Returns: LearningProfile | null
```

### Create Learning Profile
```
POST /users/:userId/learning-profile
Body: LearningProfileCreate
Returns: LearningProfile
```

### Update Learning Profile
```
PUT /users/:userId/learning-profile
Body: LearningProfileCreate
Returns: LearningProfile
```

## Component APIs

### Onboarding Component

**Props:**
```typescript
interface OnboardingProps {
  userId: number              // User ID from authentication
  onComplete: () => void      // Callback when onboarding completes
}
```

**Usage:**
```typescript
import { Onboarding } from './components'

<Onboarding userId={userId} onComplete={handleOnboardingComplete} />
```

### UserProfile Component

**Props:**
```typescript
interface UserProfileProps {
  userId: number              // User ID to load profile for
}
```

**Usage:**
```typescript
import { UserProfile } from './components'

<UserProfile userId={userId} />
```

## Features & Behavior

### Onboarding Flow

**Step 0: Current Level**
- User selects: Beginner, Intermediate, or Advanced
- Shows description for each level
- Required field

**Step 1: Target Language**
- User selects from available languages
- Fetched from backend via API
- Fallback to mock data if API unavailable
- Required field

**Step 2: Daily Study Time**
- User selects: 60, 120, or 180 minutes per day
- Shows estimated time commitment
- Required field

**Step 3: Review & Deadline**
- Summary of selected preferences
- Optional deadline date picker
- Final submission button

### User Profile Page

**View Mode:**
- Displays current learning profile in card format
- Shows profile statistics (created date, last updated)
- Edit button to modify profile

**Edit Mode:**
- All fields become editable
- Form validation before saving
- Error and success messages
- Save/Cancel actions

## Styling & Design

### Color Scheme
- **Primary**: Gradient from `#667eea` to `#764ba2` (purple/blue)
- **Backgrounds**: White, light gray (`#f5f5f5`, `#f9f9f9`)
- **Text**: Dark gray (`#1a1a1a`), medium gray (`#666`), light gray (`#999`)
- **Accents**: Error red (`#c33`), success green (`#3c3`)

### Responsive Design
- Mobile-first approach
- Fully responsive layouts
- Touch-friendly buttons and inputs
- Optimized for screens 320px and up

## Form Validation

### Onboarding Form
- **Current Level**: Required
- **Target Language**: Required
- **Daily Study Time**: Required
- **Deadline**: Optional (date validation if provided)

### User Profile Form
- Same validation as onboarding form
- Optional deadline date

### Error Handling
- User-friendly error messages
- Real-time validation feedback
- Clear indication of required fields
- Disabled submit when invalid

## API Integration

### Error Handling
```typescript
try {
  const profile = await createLearningProfile(userId, profileData)
  onComplete()
} catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to save'
  setError(message)
}
```

### Fallback Behavior
- Languages endpoint: Falls back to mock data if API unavailable
- Supports graceful degradation

### Loading States
- Loading indicator during data fetch
- Disabled submit button during save
- Loading text in buttons during operations

## Demo Application

The `App.tsx` includes a demo flow showing:

1. **Login Screen**: Simulates user authentication
2. **Onboarding Flow**: Shows complete 4-step onboarding
3. **Profile View**: Shows saved profile after onboarding
4. **Edit Profile**: Allows updating profile settings
5. **Logout**: Returns to login screen

### Run Demo

```bash
npm install
npm run dev
```

Then click "Simulate Login" to start the onboarding flow.

## Backend Integration Notes

### Database Tables Used
From the database schema, these tables are utilized:

- `users` - User accounts
- `languages` - Available programming languages
- `learning_profiles` - User learning preferences
- `user_stats` - User statistics (for future analytics)

### Expected Database Fields

**users table:**
```
id BIGINT UNSIGNED PRIMARY KEY
firebase_uid VARCHAR(128)
email VARCHAR(255)
username VARCHAR(100)
```

**languages table:**
```
id INT PRIMARY KEY
name VARCHAR(50)
judge0_id INT
is_active BOOLEAN
```

**learning_profiles table:**
```
user_id BIGINT UNSIGNED PRIMARY KEY
current_level ENUM('beginner', 'intermediate', 'advanced')
goal VARCHAR(255)
target_language_id INT
daily_time_goal_minutes INT
deadline_goal DATE
```

## Future Enhancements

Potential features for future versions:

1. **Skill Selection** - Add skill category selection during onboarding
2. **Goal Selection** - Let users choose learning goals (web, backend, algorithm, etc.)
3. **Onboarding Analytics** - Track completion rates and dropout points
4. **Wizard Progress Saving** - Save progress between sessions
5. **Social Features** - Connect with study buddies during onboarding
6. **Mobile App** - React Native version of onboarding flow

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## Accessibility

- **Semantic HTML**: Proper form structure with labels
- **Keyboard Navigation**: Full keyboard support
- **Error Messages**: Clear and descriptive
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliance

## Performance Considerations

- **Lazy Loading**: Components load on demand
- **Form Validation**: Client-side validation before API calls
- **Error Recovery**: Graceful handling of API failures
- **Mobile Optimization**: Minimal bundle size increase

## Security Notes

- Form data validated on client and server
- No sensitive data stored in localStorage
- HTTPS recommended for all API calls
- CSRF protection required on backend
- Input sanitization on backend

## Testing Recommendations

1. **Unit Tests**: Component state management
2. **Integration Tests**: API communication
3. **E2E Tests**: Complete onboarding flow
4. **Accessibility Tests**: Screen reader support
5. **Performance Tests**: Load times

---

**Last Updated**: March 2026
**Version**: 1.0
