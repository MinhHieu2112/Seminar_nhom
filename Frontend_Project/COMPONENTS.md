# Component Documentation

A comprehensive guide to all components in the Codex Frontend.

## Navigation Component

Sticky navigation bar with responsive menu.

### Props
No props - uses client-side state

### Features
- Logo with gradient text
- Desktop menu
- Mobile hamburger menu
- Responsive design
- Sign in button

### Usage
```tsx
import Navigation from '@/components/Navigation'

export default function Layout({ children }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
```

### Styling
- `bg-white border-b border-border sticky top-0 z-50`
- Uses flexbox for layout
- Mobile-first responsive design

---

## Footer Component

Full-width footer with company info and links.

### Props
No props

### Sections
- Brand section with description
- Product links
- Company links
- Social media links

### Usage
```tsx
import Footer from '@/components/Footer'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
```

### Styling
- `bg-text-primary text-white`
- Grid layout (1 column mobile, 4 columns desktop)
- Social icons with hover effects

---

## CourseCard Component

Displays a single course with all relevant information.

### Props
```typescript
interface CourseCardProps {
  course: Course
}
```

### Features
- Course thumbnail
- Category and level badges
- Course title and description
- Instructor info with avatar
- Rating and enrollment stats
- Duration indicator
- Price or "Free" badge
- View Course button

### Usage
```tsx
import CourseCard from '@/components/CourseCard'

export default function CourseGrid() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
```

### Styling
- `card` class for base styles
- Hover scale effect
- Responsive grid layout
- Gradient background for missing thumbnail

### Example Course Object
```typescript
{
  id: '1',
  title: 'Python for Beginners',
  description: 'Learn Python basics',
  thumbnail: 'https://...',
  instructor: {
    id: '1',
    name: 'John Doe',
    avatar: 'https://...'
  },
  category: 'Backend',
  level: 'beginner',
  totalLessons: 20,
  totalDuration: 10,
  rating: 4.8,
  enrolledCount: 5000,
  price: 49.99,
  isPaid: true,
  tags: ['python', 'beginner']
}
```

---

## CourseFilterBar Component

Search and filter controls for courses.

### Props
```typescript
interface CourseFiltersProps {
  onFiltersChange: (filters: CourseFilters) => void
  categories: string[]
}
```

### Features
- Search input with icon
- Collapsible filter section
- Category dropdown
- Level selector
- Sort options
- Apply filters button

### Usage
```tsx
import CourseFilterBar from '@/components/CourseFilterBar'

export default function CoursesPage() {
  const [categories, setCategories] = useState<string[]>([])

  return (
    <CourseFilterBar
      categories={categories}
      onFiltersChange={(filters) => {
        // Handle filter change
      }}
    />
  )
}
```

### Filter Options
```typescript
interface CourseFilters {
  searchQuery?: string
  category?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  sortBy?: 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
  page?: number
  pageSize?: number
}
```

---

## LessonList Component

Sidebar component showing all lessons in a course.

### Props
```typescript
interface LessonListProps {
  lessons: Lesson[]
  currentLessonId?: string
  onSelectLesson: (lessonId: string) => void
  completedLessons?: Set<string>
}
```

### Features
- Lesson cards with icons
- Locked/completed status indicators
- Duration display
- Lesson type badge
- Current lesson highlighting
- Scrollable container

### Usage
```tsx
import LessonList from '@/components/LessonList'

export default function CourseViewer() {
  const [selectedLesson, setSelectedLesson] = useState<string>()
  const completedLessons = new Set(['lesson-1', 'lesson-2'])

  return (
    <LessonList
      lessons={lessons}
      currentLessonId={selectedLesson}
      onSelectLesson={setSelectedLesson}
      completedLessons={completedLessons}
    />
  )
}
```

### Visual Indicators
- 🔒 Lock icon for locked lessons
- ✓ Green checkmark for completed
- 🎬 Video icon for video lessons
- 📄 Document icon for documents
- 🟦 Blue border for current lesson

---

## Accordion Component

Reusable accordion for collapsible content.

### Props
```typescript
interface AccordionProps {
  items: AccordionItem[]
}

interface AccordionItem {
  id: string
  title: string
  content: string
}
```

### Features
- Smooth open/close animation
- Chevron icon rotation
- Single item open at a time
- Keyboard accessible

### Usage
```tsx
import Accordion from '@/components/Accordion'

export default function FAQPage() {
  const faqItems = [
    {
      id: '1',
      title: 'How do I enroll?',
      content: 'Click the Enroll button on any course...'
    },
    // more items
  ]

  return <Accordion items={faqItems} />
}
```

### Styling
- Border around entire accordion
- Hover state on title
- Smooth chevron rotation
- Gray background for content area

---

## Modal Component

Dialog component for modals and overlays.

### Props
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}
```

### Features
- Semi-transparent backdrop
- Click-outside-to-close
- Close button (×)
- Title header
- Content area
- Action buttons (optional)
- Smooth animation

### Usage
```tsx
import Modal from '@/components/Modal'
import { useState } from 'react'

export default function Page() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        actions={
          <>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button className="btn-primary">Confirm</button>
          </>
        }
      >
        Are you sure you want to proceed?
      </Modal>
    </>
  )
}
```

### Styling
- Fixed positioning with z-50
- Black backdrop with opacity
- Centered on screen
- Rounded corners
- Shadow effect

---

## Page Components

### Home Page (/)
Entry point with hero section and features overview.

**Sections:**
- Hero with CTA buttons
- 3-column features grid
- Featured courses preview

**Key Elements:**
- Gradient background
- Call-to-action buttons
- Responsive grid

### Courses Page (/courses)
Browse and filter courses.

**Features:**
- Course grid (2 columns desktop)
- Sticky filter sidebar
- Loading states
- Empty states
- Error handling

**Layout:**
- 1/4 width sidebar (filter)
- 3/4 width main content (courses)
- Responsive stacking on mobile

### Course Detail Page (/courses/[courseId])
View course and lessons.

**Features:**
- Course header with stats
- Progress bar
- Lesson list sidebar
- Lesson viewer
- Mark complete button

**Layout:**
- Full width header
- 1/4 width lesson sidebar
- 3/4 width content viewer
- Navigation between lessons

---

## Utility Classes

### Layout
```css
.container-max      /* Max-width container with padding */
.flex               /* Flexbox display */
.grid               /* CSS grid display */
```

### Buttons
```css
.btn-primary        /* Primary button (gradient) */
.btn-secondary      /* Secondary button (gray) */
```

### Cards & Containers
```css
.card               /* White card with shadow */
```

### Typography
```css
.font-bold          /* Bold text */
.text-center        /* Centered text */
.text-text-primary  /* Primary text color */
.text-text-secondary /* Secondary text color */
```

### Colors
```css
.bg-primary         /* Primary background */
.bg-background      /* Page background */
.text-success       /* Success text color */
.text-error         /* Error text color */
```

### Badges
```css
.badge              /* Base badge */
.badge-primary      /* Blue badge */
.badge-success      /* Green badge */
.badge-warning      /* Yellow badge */
```

---

## Component Composition Examples

### Course Grid with Filter
```tsx
'use client'

import { useState, useEffect } from 'react'
import CourseCard from '@/components/CourseCard'
import CourseFilterBar from '@/components/CourseFilterBar'
import { getCourses, getCategories } from '@/lib/api'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({})

  useEffect(() => {
    getCategories().then(r => setCategories(r.data || []))
  }, [])

  useEffect(() => {
    getCourses(filters).then(r => {
      setCourses(r.data?.data || [])
    })
  }, [filters])

  return (
    <div className="grid grid-cols-4 gap-8">
      <CourseFilterBar
        categories={categories}
        onFiltersChange={setFilters}
      />
      <div className="col-span-3 grid grid-cols-2 gap-6">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
```

### Course Viewer with Lessons
```tsx
'use client'

import { useState } from 'react'
import LessonList from '@/components/LessonList'

export default function CourseViewer() {
  const [selectedLesson, setSelectedLesson] = useState(lessons[0])
  const [completedLessons] = useState(new Set(['lesson-1']))

  return (
    <div className="grid grid-cols-4 gap-8">
      <LessonList
        lessons={lessons}
        currentLessonId={selectedLesson?.id}
        onSelectLesson={(id) => {
          setSelectedLesson(lessons.find(l => l.id === id))
        }}
        completedLessons={completedLessons}
      />
      <div className="col-span-3">
        {selectedLesson && (
          <div>
            <h2>{selectedLesson.title}</h2>
            <video src={selectedLesson.content.videoUrl} />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Best Practices

1. **Always provide keys when mapping**
   ```tsx
   {items.map(item => <Item key={item.id} {...item} />)}
   ```

2. **Use `'use client'` only when needed**
   ```tsx
   'use client'
   // Only include interactive logic
   ```

3. **Prop drilling? Use Context**
   ```tsx
   const ThemeContext = createContext()
   // Provide at top, consume below
   ```

4. **Reusable components**
   - Keep components focused
   - Accept props for customization
   - Document prop types

5. **Accessible components**
   - Use semantic HTML
   - Add ARIA labels
   - Support keyboard navigation

---

**Last Updated**: March 30, 2026
