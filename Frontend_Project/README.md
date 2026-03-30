# Codex Frontend - Course Learning Platform

A modern, responsive frontend for a code learning platform built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

## 🎯 Features

- **Course Listing & Discovery**
  - Browse courses with powerful filtering and search
  - Sort by popularity, rating, price, and date
  - Filter by category and skill level

- **Course Learning**
  - Video and document lesson viewers
  - Lesson progress tracking
  - Course completion metrics
  - Prerequisites and lesson locking

- **Responsive Design**
  - Mobile-first approach
  - Works seamlessly on all devices
  - Touch-friendly navigation

- **Modern Tech Stack**
  - Next.js 16 with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Client components for interactivity

## 📁 Project Structure

```
src/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with Navigation & Footer
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── courses/
│       ├── page.tsx         # Courses listing page
│       └── [courseId]/
│           └── page.tsx     # Course detail & lesson viewer
│
├── components/              # Reusable React components
│   ├── Navigation.tsx       # Top navigation bar
│   ├── Footer.tsx           # Footer component
│   ├── CourseCard.tsx       # Individual course display
│   ├── CourseFilterBar.tsx  # Search & filter controls
│   ├── LessonList.tsx       # Lesson sidebar
│   ├── Accordion.tsx        # Accordion component
│   └── Modal.tsx            # Modal dialog component
│
├── lib/
│   └── api.ts               # API utility functions
│
└── types/
    └── index.ts             # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. Navigate to the project directory:
```bash
cd Frontend_Project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Key Components

### Navigation
Sticky top navigation with logo, menu items, and mobile hamburger menu.

```tsx
import Navigation from '@/components/Navigation'
```

### Footer
Footer with company info, links, and social media icons.

```tsx
import Footer from '@/components/Footer'
```

### CourseCard
Displays individual course with thumbnail, stats, and enrollment button.

```tsx
<CourseCard course={courseData} />
```

### CourseFilterBar
Provides search and filtering functionality for courses.

```tsx
<CourseFilterBar 
  categories={categories}
  onFiltersChange={handleFilters}
/>
```

### LessonList
Sidebar component showing all lessons in a course with lock status.

```tsx
<LessonList
  lessons={lessons}
  currentLessonId={selectedId}
  onSelectLesson={handleSelect}
  completedLessons={completed}
/>
```

### Accordion
Reusable accordion component for FAQs or collapsible content.

```tsx
<Accordion items={accordionItems} />
```

### Modal
Dialog component for modals and overlays.

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Title"
  actions={<button>Action</button>}
>
  Content here
</Modal>
```

## 🔌 API Integration

The app connects to a backend API with the following endpoints:

### Courses
- `GET /courses` - List courses with filtering
- `GET /courses/:id` - Get course details
- `GET /courses/:id/lessons` - Get course lessons
- `POST /courses/:id/enroll` - Enroll in course

### Lessons
- `GET /courses/:courseId/lessons/:lessonId` - Get lesson details
- `POST /courses/:courseId/lessons/:lessonId/complete` - Mark lesson complete
- `PUT /courses/:courseId/lessons/:lessonId/progress` - Update lesson progress

### Progress
- `GET /courses/:id/progress` - Get course progress

### Utility
- `GET /categories` - Get all course categories

## 🎨 Styling

The project uses Tailwind CSS with custom design tokens:

### Colors
- **Primary**: `#667eea` (purple-blue)
- **Primary Dark**: `#764ba2` (darker purple)
- **Secondary**: `#f093fb` (pink)
- **Background**: `#f5f5f5` (light gray)
- **Success**: `#10b981` (green)
- **Error**: `#ef4444` (red)
- **Warning**: `#f59e0b` (amber)

### Utility Classes
```css
.container-max      /* Max-width container with padding */
.btn-primary        /* Primary button style */
.btn-secondary      /* Secondary button style */
.card               /* Card with shadow and border */
.badge              /* Badge element */
.badge-primary      /* Blue badge */
.badge-success      /* Green badge */
.badge-warning      /* Yellow badge */
```

## 📄 Pages

### Home Page (`/`)
- Hero section with call-to-action
- Features overview
- Quick access links
- Responsive layout

### Courses Page (`/courses`)
- Course grid with cards (2 columns on desktop)
- Filter sidebar with search
- Category and level filtering
- Sort options
- Loading and empty states

### Course Detail Page (`/courses/[courseId]`)
- Course information and stats
- Progress bar
- Lesson list sidebar (sticky)
- Lesson viewer (video/document)
- Mark complete functionality
- Navigation between lessons

## 🧩 Type Definitions

All types are defined in `src/types/index.ts`:

```typescript
interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: { id: string; name: string; avatar: string }
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  totalLessons: number
  totalDuration: number
  rating: number
  enrolledCount: number
  price: number | null
  isPaid: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  type: 'video' | 'document' | 'quiz'
  content: { videoUrl?: string; documentUrl?: string; quizData?: QuizQuestion[] }
  duration: number
  isLocked: boolean
  prerequisites?: string[]
  createdAt: string
  updatedAt: string
}

interface CourseProgress {
  userId: string
  courseId: string
  lessonProgress: LessonProgress[]
  completedAt?: string
  progressPercentage: number
}
```

See `src/types/index.ts` for complete definitions.

## 🔧 Build & Deployment

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint
```bash
npm run lint
```

## 📝 Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## 🛠️ Development Tips

1. **Hot Reload**: Changes are automatically reflected thanks to Next.js HMR
2. **TypeScript**: Always provide types for better development experience
3. **Components**: Keep components focused and reusable
4. **API Calls**: Use the utility functions in `lib/api.ts`
5. **Styling**: Use Tailwind classes first, then custom CSS
6. **Responsive**: Use `md:` and `lg:` prefixes for responsive design

## 🎯 Next.js Best Practices Used

- **App Router**: Modern file-based routing with `/app` directory
- **Type Safety**: Full TypeScript support
- **Server Components**: Default to server components where possible
- **Client Components**: Mark interactive components with `'use client'`
- **API Utility Layer**: Centralized API calls in `lib/api.ts`
- **Image Optimization**: Use `next/image` where applicable
- **Font Optimization**: Self-hosted fonts with `next/font/google`
- **Metadata**: SEO-ready metadata in layout
- **Performance**: CSS modules and Tailwind for optimized styling

## 🐛 Troubleshooting

### API Connection Issues
- Verify the backend server is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors
- Verify API endpoints are correct

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### Styling Issues
- Rebuild Tailwind cache: `npm run build`
- Clear browser cache: Dev Tools → Application → Clear Storage
- Check custom Tailwind config in `tailwind.config.ts`

### Performance
- Use Next.js DevTools to identify slow components
- Check for unnecessary re-renders with React DevTools
- Optimize images using Next.js Image component
- Use dynamic imports for large components

## 📊 File Statistics

| Category | Count |
|----------|-------|
| Pages | 3 (home, courses, course detail) |
| Components | 7 (Navigation, Footer, CourseCard, etc.) |
| TypeScript Types | 8+ interfaces |
| API Endpoints | 9+ supported |
| Tailwind Classes | 50+ utilities |
| CSS Files | 1 global (globals.css) |
| Responsive Breakpoints | 3 (sm, md, lg) |

## 🔐 Security Considerations

- Environment variables for sensitive data
- TypeScript for catching type errors
- Input validation on client and server
- CORS configuration in API utility
- No sensitive data in localStorage

## ♿ Accessibility

- Semantic HTML elements
- Proper form labels and ARIA attributes
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## 📱 Responsive Design

- Mobile-first approach (320px+)
- Tablet optimizations (768px+)
- Desktop enhancements (1024px+)
- Touch-friendly buttons and spacing
- Flexible grid layouts

## 🤝 Contributing

To contribute to this project:

1. Create a feature branch
2. Make your changes with TypeScript
3. Test on multiple screen sizes
4. Update documentation
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API integration guide
3. Open a GitHub issue
4. Contact the team

---

**Version**: 1.0  
**Framework**: Next.js 16  
**Status**: ✅ Production Ready  
**Last Updated**: March 30, 2026

🚀 **Ready to launch your learning platform!**

