## Architecture & Design Decisions

### Next.js 16 with App Router

We use the modern App Router pattern for better organization:

```
app/
├── layout.tsx           # Root layout
├── page.tsx             # Home (/)
└── courses/
    ├── layout.tsx       # Courses layout (optional)
    ├── page.tsx         # /courses
    └── [courseId]/
        └── page.tsx     # /courses/:id
```

**Benefits:**
- Automatic code splitting per route
- Built-in layout nesting
- Easier SEO with metadata
- Better performance with streaming

### Client Components Strategy

We use `'use client'` selectively:

```typescript
// Server Component (default in app/)
export default function Page() {
  // Can access databases directly
  // Better for initial render
}

// Client Component (when needed)
'use client'
export default function InteractiveComponent() {
  // useState, useEffect, event handlers
  // User interactions
}
```

### Type Safety

Full TypeScript implementation with:
- Strict mode enabled
- No implicit any
- Comprehensive interfaces
- API contract validation

### API Layer Abstraction

Centralized API calls in `lib/api.ts`:

```typescript
// All API calls go through here
export async function getCourses(filters?: CourseFilters) {
  return apiCall<PaginatedResponse<Course>>('/courses', options)
}
```

**Benefits:**
- Single point of error handling
- Consistent request/response format
- Easy to mock for testing
- Centralized base URL

## Component Hierarchy

```
RootLayout
├── Navigation (sticky)
├── Main Content
│   └── Pages (home, courses, course detail)
│       ├── Server-rendered content
│       └── Client Components (CourseCard, CourseFilterBar, etc.)
└── Footer
```

## Styling Strategy

### Tailwind CSS + Custom Tokens

1. **Base styles** (`globals.css`):
   - Reset styles
   - Custom properties
   - Utility classes

2. **Component styles** (inline with Tailwind):
   ```tsx
   <div className="p-4 bg-white rounded-lg border border-border">
   ```

3. **Complex styles** (CSS modules if needed):
   ```tsx
   import styles from './component.module.css'
   ```

### Design Tokens (Tailwind Config)

```javascript
theme: {
  colors: {
    primary: '#667eea',
    'primary-dark': '#764ba2',
    // ... more tokens
  }
}
```

## Performance Optimization

### 1. Image Optimization
- Use `next/image` for optimization
- Automatic format conversion
- Responsive images

### 2. Code Splitting
- Automatic per route
- Dynamic imports for large components
- Lazy loading for below-fold content

### 3. Caching Strategy
- Static generation for home page
- ISR (Incremental Static Regeneration) for course list
- Dynamic rendering for user-specific data

### 4. Bundle Size
- Tree-shaking enabled
- Unused CSS removed by Tailwind
- No inline fonts (using next/font/google)

## State Management

For this project, we use simple patterns:

1. **Component State**: `useState` for local UI state
2. **Server State**: API calls for server data
3. **Route State**: URL parameters for navigation state

For complex apps, consider:
- Context API
- Redux / Zustand
- TanStack Query (SWR alternative)

## Error Handling

### API Errors
```typescript
const response = await getCourses()
if (!response.success) {
  // Handle error: response.error
}
```

### Component Errors
- Error boundaries (using `error.tsx`)
- Fallback UI
- User-friendly messages

## Testing Strategy

### Unit Tests
```typescript
// Test individual functions
test('getCourses returns courses', async () => {
  const result = await getCourses()
  expect(result.success).toBe(true)
})
```

### Integration Tests
```typescript
// Test components with data
test('CourseCard renders course info', () => {
  render(<CourseCard course={mockCourse} />)
  expect(screen.getByText(mockCourse.title)).toBeInTheDocument()
})
```

### E2E Tests
```typescript
// Test user flows
test('User can browse and enroll in course', async () => {
  await page.goto('/courses')
  await page.click('[data-testid="course-card"]')
  await page.click('button:has-text("Enroll")')
})
```

## Deployment Options

### Vercel (Recommended)
```bash
git push              # Auto-deploys
```

### Self-Hosted (Node.js)
```bash
npm run build
npm start
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["npm", "start"]
```

### Environment Variables per Environment

```
Development (.env.local):
NEXT_PUBLIC_API_URL=http://localhost:8000/api

Staging (.env.staging):
NEXT_PUBLIC_API_URL=https://api-staging.codex.dev/api

Production (.env.production):
NEXT_PUBLIC_API_URL=https://api.codex.dev/api
```

## SEO & Meta Tags

### Page-level Metadata
```typescript
export const metadata: Metadata = {
  title: 'Codex - Learn to Code',
  description: '...',
  keywords: ['coding', 'courses'],
}
```

### Dynamic Metadata
```typescript
export async function generateMetadata({ params }) {
  const course = await getCourseById(params.courseId)
  return {
    title: course.title,
    description: course.description,
  }
}
```

## Monitoring & Analytics

### Error Tracking
- Sentry for error monitoring
- User impact analysis

### Performance Monitoring
- Core Web Vitals
- Page load times
- Component render times

### Analytics
- User behavior tracking
- Course enrollment funnel
- Lesson completion rates

## Security Best Practices

### 1. Environment Variables
- Never commit `.env.local`
- Use `NEXT_PUBLIC_` prefix carefully
- Rotate API keys regularly

### 2. Input Validation
- Validate on client AND server
- Sanitize user input
- Use TypeScript for type safety

### 3. CORS & CSP
```javascript
// In headers or middleware
headers: {
  'Content-Security-Policy': "default-src 'self'",
}
```

### 4. Authentication
- Use secure session cookies
- Implement CSRF protection
- Hash passwords server-side

## Database Considerations

### Schema
```sql
-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL,
  category VARCHAR(50),
  level ENUM('beginner', 'intermediate', 'advanced'),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(255),
  type ENUM('video', 'document', 'quiz'),
  lesson_order INT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Progress tracking
CREATE TABLE user_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  UNIQUE(user_id, lesson_id)
)
```

### Indexing
```sql
CREATE INDEX idx_course_category ON courses(category);
CREATE INDEX idx_lesson_course ON lessons(course_id);
CREATE INDEX idx_progress_user ON user_progress(user_id);
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy
on: [push]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
      - name: Deploy
        run: npm run deploy
```

## Troubleshooting Guide

### Build Fails
1. Check Node.js version (should be 18+)
2. Clear `.next` folder: `rm -rf .next`
3. Reinstall: `rm -rf node_modules && npm install`
4. Check TypeScript: `npx tsc --noEmit`

### API Integration Fails
1. Verify API URL in `.env.local`
2. Check backend is running
3. Test with curl: `curl http://localhost:8000/api/courses`
4. Check CORS headers

### Styling Issues
1. Tailwind config updated?
2. Global CSS imported?
3. Browser cache cleared?
4. Try: `npm run build`

### Performance Issues
1. Check bundle size: `npm run build -- --analyze`
2. Monitor Core Web Vitals
3. Profile with Chrome DevTools
4. Use React DevTools to find re-renders

## Future Roadmap

### Phase 2
- [ ] User authentication system
- [ ] Course enrollment & payments
- [ ] Lesson comments & discussions
- [ ] Certificates & badges

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Live classes
- [ ] AI-powered recommendations
- [ ] Gamification features

### Phase 4
- [ ] Instructor dashboard
- [ ] Course analytics
- [ ] Advanced course builder
- [ ] Marketplace features

---

**Last Updated**: March 30, 2026  
**Maintained By**: Codex Development Team
