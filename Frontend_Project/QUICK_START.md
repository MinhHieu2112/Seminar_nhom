# Codex Onboarding - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd Tuan_1/Javascript/fe-project
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Step 3: Run Through Demo

1. Click "Simulate Login"
2. Complete all 4 onboarding steps
3. View your profile
4. Try editing your profile
5. Click "Logout" to reset

## 📋 Key Files to Know

| File | Purpose | When to Modify |
|------|---------|-----------------|
| `src/components/Onboarding.tsx` | Main onboarding form | Customize form fields or flow |
| `src/components/UserProfile.tsx` | Profile view/edit | Add profile sections |
| `src/types.ts` | TypeScript definitions | Add new fields to profile |
| `src/api.ts` | API functions | Connect to real backend |
| `src/App.tsx` | Main app component | Add routing or auth |

## 🔧 Configuration

### Update Backend URL

Edit `src/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000'  // Change to your backend URL
```

### Add Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Codex
```

Update `src/api.ts` to use:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL
```

## 🔗 Connect to Backend

### 1. Check API Endpoints

Your backend should implement these endpoints:

```
GET    /languages
GET    /users/:userId/learning-profile
POST   /users/:userId/learning-profile
PUT    /users/:userId/learning-profile
```

See `API_IMPLEMENTATION_GUIDE.ts` for full examples.

### 2. Verify Request/Response Format

**Create Profile Request:**
```json
{
  "current_level": "beginner",
  "goal": "learning",
  "target_language_id": 2,
  "daily_time_goal_minutes": 60,
  "deadline_goal": "2026-12-31"
}
```

**Profile Response:**
```json
{
  "user_id": 1,
  "current_level": "beginner",
  "goal": "learning",
  "target_language_id": 2,
  "daily_time_goal_minutes": 60,
  "deadline_goal": "2026-12-31",
  "created_at": "2026-03-30T10:00:00Z",
  "updated_at": "2026-03-30T10:00:00Z"
}
```

### 3. Update Languages List

Edit `src/api.ts` getLanguages() function:

```typescript
export async function getLanguages(): Promise<Language[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/languages`)
    // ... your backend response
  } catch (err) {
    // Fallback mock data
    return [
      { id: 1, name: 'Python', judge0_id: 71, is_active: true },
      { id: 2, name: 'JavaScript', judge0_id: 63, is_active: true },
      { id: 3, name: 'Java', judge0_id: 62, is_active: true },
      { id: 4, name: 'C#', judge0_id: 51, is_active: true },
    ]
  }
}
```

## 🎨 Customize Styling

### Change Primary Color

Edit `src/components/Onboarding.css`:

```css
/* Find and replace all instances of these colors */
#667eea  /* Primary blue */
#764ba2  /* Secondary purple */
```

### Change Fonts

Edit `src/index.css`:

```css
:root {
  font-family: 'Your Font Name', sans-serif;
}
```

## 🔐 Add Authentication

### Firebase Example

```typescript
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

useEffect(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser({
        id: parseInt(user.uid),
        hasCompletedOnboarding: false
      })
    }
  })
}, [])
```

### Supabase Example

```typescript
import { useAuthState } from 'react-firebase-hooks/auth'

const [user] = useAuthState(auth)

useEffect(() => {
  if (user) {
    setCurrentUser({
      id: parseInt(user.uid),
      hasCompletedOnboarding: false
    })
  }
}, [user])
```

## 📊 Add Analytics

### Google Analytics Example

```typescript
export function trackEvent(eventName: string, data?: any) {
  if (window.gtag) {
    window.gtag('event', eventName, data)
  }
}

// In Onboarding.tsx
const handleSubmit = async () => {
  trackEvent('onboarding_completed', {
    level: state.currentLevel,
    language: state.targetLanguage,
    time: state.dailyTimeGoal
  })
  // ... submit logic
}
```

## 🧪 Testing Locally

### Test Form Validation

1. Try clicking "Next" without selecting an option
2. Should show error "Please select your current level"
3. Select an option and error should clear

### Test API Errors

Temporarily break the API endpoint and verify:
1. Error message displays
2. Retry button works
3. No console errors

### Test Mobile

1. Press F12 to open DevTools
2. Click device toggle (mobile view)
3. Rotate between portrait/landscape
4. Verify responsive layout

## 📝 Common Customizations

### Add More Language Options

Edit `src/types.ts`:

```typescript
export type TargetLanguage = 'Python' | 'JavaScript' | 'Java' | 'C#' | 'Rust' | 'Go'
```

Then update your `getLanguages()` API call.

### Add More Study Time Options

Edit `src/types.ts`:

```typescript
export type DailyTimeGoal = 30 | 60 | 120 | 180 | 240
```

Then update the form options in `Onboarding.tsx`.

### Add Learning Goal Selection

Add to `types.ts`:

```typescript
export type LearningGoal = 'web' | 'backend' | 'algorithm' | 'interview' | 'project'
```

Add to form in `Onboarding.tsx`:

```typescript
{state.currentStep === 0 && (
  // ... existing level selection ...
  // Add goal selection here
)}
```

## 🐛 Debugging

### Enable Debug Logs

Add to `src/api.ts`:

```typescript
export async function getLearningProfile(userId: number) {
  try {
    console.log('[v0] Fetching profile for user:', userId)
    const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-profile`)
    const data = await response.json()
    console.log('[v0] Profile fetched:', data)
    return data
  } catch (err) {
    console.error('[v0] Error fetching profile:', err)
  }
}
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Perform onboarding steps
4. Look for API requests
5. Check response status and body

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Backend API endpoints implemented
- [ ] Database tables created and migrated
- [ ] API_BASE_URL set to production endpoint
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested
- [ ] Performance profiled
- [ ] Security review completed

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_SUMMARY.md` | Overview of entire implementation |
| `ONBOARDING_DOCUMENTATION.md` | Complete feature documentation |
| `API_IMPLEMENTATION_GUIDE.ts` | Backend API examples |
| `INTEGRATION_EXAMPLES.tsx` | Integration patterns |
| `COMPLETION_CHECKLIST.md` | Verification checklist |

## 🆘 Troubleshooting

### API returns 404
- Check backend is running
- Verify API_BASE_URL is correct
- Check endpoint paths match backend

### Form not submitting
- Open DevTools Console
- Check for JavaScript errors
- Verify all required fields are selected
- Check network tab for failed requests

### Styling looks wrong
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check CSS files are loaded in DevTools

### TypeScript errors
- Run `npm run build`
- Check tsconfig.json is correct
- Verify all types are imported

## 📞 Need Help?

1. Check `ONBOARDING_DOCUMENTATION.md` for feature details
2. Review `API_IMPLEMENTATION_GUIDE.ts` for backend setup
3. Look at `INTEGRATION_EXAMPLES.tsx` for common patterns
4. Check browser DevTools Console for errors

---

**Happy Coding! 🚀**

Last Updated: March 30, 2026
