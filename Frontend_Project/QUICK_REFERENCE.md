# Quick Reference Guide

## Project Commands

```bash
# Installation
npm install

# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run lint             # Run linter
npm run build            # Build for production
npm start                # Start production server
```

## File Quick Access

| File | Purpose | Size |
|------|---------|------|
| `src/types/index.ts` | TypeScript interfaces | 106 lines |
| `src/lib/api.ts` | API utility functions | 109 lines |
| `src/app/layout.tsx` | Root layout | 34 lines |
| `src/app/page.tsx` | Home page | 78 lines |
| `src/app/courses/page.tsx` | Courses listing | 124 lines |
| `src/app/courses/[courseId]/page.tsx` | Course detail | 250 lines |
| `src/app/globals.css` | Global styles | 92 lines |

## Component Quick Access

| Component | Lines | Import Path |
|-----------|-------|-------------|
| Navigation | 61 | `@/components/Navigation` |
| Footer | 93 | `@/components/Footer` |
| CourseCard | 91 | `@/components/CourseCard` |
| CourseFilterBar | 126 | `@/components/CourseFilterBar` |
| LessonList | 85 | `@/components/LessonList` |
| Accordion | 45 | `@/components/Accordion` |
| Modal | 52 | `@/components/Modal` |

## API Functions

```typescript
// Courses
getCourses(filters?: CourseFilters)
getCourseById(courseId: string)
getCourseLessons(courseId: string)
enrollCourse(courseId: string)

// Lessons
getLessonById(courseId: string, lessonId: string)
markLessonComplete(courseId: string, lessonId: string)

// Progress
getCourseProgress(courseId: string)
updateLessonProgress(courseId: string, lessonId: string, watchedDuration?: number)

// Utility
getCategories()
```

## Common Tailwind Classes

### Layout
```tailwind
flex            justify-between    items-center
grid            grid-cols-2         gap-6
container-max   mx-auto             px-4
```

### Buttons
```tailwind
btn-primary     btn-secondary
px-4 py-2       rounded-lg
hover:shadow-lg transition-all
```

### Cards & Containers
```tailwind
card            bg-white            rounded-lg
border          border-border       shadow-md
p-4             space-y-4
```

### Text
```tailwind
text-lg         font-bold           text-center
text-text-primary text-text-secondary
line-clamp-2    truncate
```

### Responsive
```tailwind
md:grid-cols-2  lg:col-span-3
sm:px-6         lg:px-8
block md:flex
```

## Type Quick Reference

```typescript
// Course
interface Course {
  id: string
  title: string
  description: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  totalLessons: number
  totalDuration: number
  rating: number
  price: number | null
  isPaid: boolean
}

// Lesson
interface Lesson {
  id: string
  courseId: string
  title: string
  type: 'video' | 'document' | 'quiz'
  duration: number
  isLocked: boolean
  content: { videoUrl?: string; documentUrl?: string }
}

// Progress
interface CourseProgress {
  userId: string
  courseId: string
  progressPercentage: number
  lessonProgress: LessonProgress[]
}

// Filters
interface CourseFilters {
  searchQuery?: string
  category?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  sortBy?: 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
  page?: number
}
```

## Component Props Quick Reference

### CourseCard
```typescript
<CourseCard course={courseObject} />
```

### CourseFilterBar
```typescript
<CourseFilterBar
  categories={['Backend', 'Frontend']}
  onFiltersChange={(filters) => {}}
/>
```

### LessonList
```typescript
<LessonList
  lessons={lessonsArray}
  currentLessonId="lesson-1"
  onSelectLesson={(id) => {}}
  completedLessons={new Set(['lesson-1'])}
/>
```

### Accordion
```typescript
<Accordion items={[
  { id: '1', title: 'Question?', content: 'Answer...' }
]} />
```

### Modal
```typescript
<Modal
  isOpen={true}
  onClose={() => {}}
  title="Title"
  actions={<button>OK</button>}
>
  Content
</Modal>
```

## Color Palette

```css
/* Primary Colors */
#667eea    /* Primary Blue */
#764ba2    /* Primary Dark Purple */

/* Neutral Colors */
#1a1a1a    /* Text Primary */
#666       /* Text Secondary */
#e0e0e0    /* Border */
#f5f5f5    /* Background */

/* Status Colors */
#10b981    /* Success Green */
#ef4444    /* Error Red */
#f59e0b    /* Warning Amber */
```

## Routes

```
/                                  Home
/courses                          Courses listing
/courses/[courseId]               Course detail
/courses/[courseId]/lessons/[id]  Lesson viewer (optional)
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

1. Use `next/image` for images
2. Lazy load below-fold components
3. Memoize expensive computations
4. Keep bundle small: `npm run build --analyze`
5. Monitor Core Web Vitals

## Debugging

```bash
# TypeScript errors
npx tsc --noEmit

# Build debugging
npm run build

# Bundle analysis
npm run build -- --analyze

# Code inspection
# Use Chrome DevTools or VS Code Debugger
```

## File Naming Conventions

- **Pages**: `page.tsx` (exported as default)
- **Components**: `ComponentName.tsx` (PascalCase)
- **Utilities**: `utility-name.ts` (kebab-case)
- **Types**: `types.ts` or `filename.types.ts`
- **Styles**: `globals.css` (global) or `ComponentName.module.css` (scoped)

## Import Paths

```typescript
// Use @ alias for cleaner imports
import Navigation from '@/components/Navigation'
import { Course } from '@/types'
import { getCourses } from '@/lib/api'

// Instead of:
// import Navigation from '../../../components/Navigation'
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/course-listing

# Make changes and commit
git add .
git commit -m "feat: add course listing page"

# Push to remote
git push origin feature/course-listing

# Create pull request on GitHub
```

## Production Checklist

- [ ] All TypeScript errors resolved
- [ ] API URL configured
- [ ] Environment variables set
- [ ] Build completes successfully
- [ ] No console errors in production build
- [ ] All routes working
- [ ] Responsive design tested
- [ ] Performance acceptable
- [ ] Security review done
- [ ] Analytics configured

## Useful Links

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **MDN Web Docs**: https://developer.mozilla.org

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API not working | Check `.env.local` and backend URL |
| Styling broken | Clear `.next` folder, restart dev server |
| TypeScript errors | Run `npx tsc --noEmit` to see all errors |
| Build fails | Try `npm ci` and `rm -rf .next` |
| Hot reload not working | Check Next.js version, restart dev server |

## Code Snippet Templates

### Create a new page
```typescript
// src/app/newpage/page.tsx
'use client'

export default function NewPage() {
  return (
    <main className="container-max py-8">
      <h1 className="text-4xl font-bold mb-4">Title</h1>
      {/* Content */}
    </main>
  )
}
```

### Create a new component
```typescript
// src/components/NewComponent.tsx
'use client'

interface Props {
  title: string
}

export default function NewComponent({ title }: Props) {
  return (
    <div className="card p-4">
      <h2 className="font-bold">{title}</h2>
    </div>
  )
}
```

### Fetch data in a page
```typescript
import { getCourses } from '@/lib/api'

export default async function Page() {
  const response = await getCourses()
  const courses = response.data?.data || []

  return (
    <div className="grid grid-cols-2 gap-6">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
```

---

**Print this for quick reference during development!**
