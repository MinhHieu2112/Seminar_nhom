# COURSE LEARNING BACKEND - QUICK REFERENCE

## ✅ WHAT'S IMPLEMENTED

### 📦 Modules Created
- `CoursesModule` - Course listing, filtering, enrollment
- `LessonsModule` - Lesson access, progress tracking, unlock logic

### 📊 Database Models Added
- `Course` - Course metadata (title, description, difficulty, category, thumbnail)
- `CourseEnrollment` - User enrollment tracking (unique per user-course)
- `Lesson` - Lesson content (title, type: VIDEO/DOCUMENT, URL, order)
- `UserLessonProgress` - Progress tracking (watched duration, completion status)
- `CourseCategory` - Course categories (for future use)

### 🔌 API ENDPOINTS

#### Courses (8 endpoints)
```
GET    /courses
       ?difficulty=beginner&category=programming&status=enrolled
       Response: CourseListDto[]

GET    /courses/:id
       Response: CourseDetailDto

POST   /courses/:id/enroll
       Response: EnrollCourseDto

GET    /languages
       Response: LanguageDto[]
```

#### Lessons (3 endpoints)
```
GET    /lessons/course/:courseId
       Response: LessonDto[] (ordered by lessonOrder)

GET    /lessons/:id
       Response: LessonDetailDto (with nextLessonId, previousLessonId)

POST   /lessons/:id/progress
       Body: { watchedDurationSec?: number, completed?: boolean }
       Response: UpdateLessonProgressDto
```

### 🔐 AUTHENTICATION
- All endpoints except `/auth/*` and `/languages` require AuthGuard
- @CurrentUser() decorator extracts userId from JWT token
- Supabase token validation in AuthGuard

### 📋 COURSE FILTERING
```
GET /courses?difficulty=beginner            # Filter by difficulty
GET /courses?category=programming            # Filter by category
GET /courses?status=enrolled                 # Filter by enrollment
GET /courses?status=not-enrolled             # Not enrolled
GET /courses?status=all                      # All courses (default)
```

### 📝 FEATURES

#### Course Listing
- Shows all courses with enrollment status ✅
- Filters by difficulty (beginner, intermediate, advanced) ✅
- Filters by category ✅
- Shows progress percentage for enrolled courses ✅
- Calculates progress: (completedLessons / totalLessons) * 100 ✅

#### Course Detail
- Full course information ✅
- Lessons count ✅
- User's current progress ✅
- Enrollment status ✅

#### Course Enrollment
- Create enrollment record ✅
- Prevent duplicate enrollments ✅
- User-course unique constraint ✅

#### Lesson Access
- Get all lessons ordered by lesson_order ✅
- Support VIDEO and DOCUMENT content types ✅
- Toggle lock status based on prerequisites ✅
- First lesson always unlocked ✅
- Subsequent lessons locked until previous completed ✅

#### Lesson Progress Tracking
- Track watched duration in seconds ✅
- Mark lesson as completed ✅
- Store completion timestamp ✅
- Upsert pattern for idempotent updates ✅

#### Split Layout Support
- Lesson detail includes nextLessonId ✅
- Lesson detail includes previousLessonId ✅
- Supports navigation between lessons ✅

#### Lesson Unlock Order Enforcement
- Previous lesson must be completed to unlock next ✅
- isLocked flag in response ✅
- Programmatically enforced in service layer ✅
- Cannot update progress for locked lessons ✅

### 📦 DATA TRANSFER OBJECTS
```
CourseListDto          # List item response
CourseDetailDto        # Detail page response
LessonDto              # Lesson in list
LessonDetailDto        # Single lesson with metadata
EnrollCourseDto        # Enrollment response
UpdateLessonProgressDto # Progress update response
UpdateLessonProgressInputDto # Progress update input
CourseFilterDto        # Filter parameters
```

### 🗄️ PRISMA QUERIES

**List courses with enrollment:**
```typescript
prisma.course.findMany({
  where: { difficulty: filter.difficulty },
  include: {
    enrollments: { where: { userId }, take: 1 },
    lessons: { select: { id: true } }
  }
})
```

**Get course detail:**
```typescript
prisma.course.findUnique({
  where: { id: courseId },
  include: {
    enrollments: { where: { userId }, take: 1 },
    lessons: { select: { id: true } }
  }
})
```

**Get lessons ordered:**
```typescript
prisma.lesson.findMany({
  where: { courseId },
  orderBy: { lessonOrder: 'asc' }
})
```

**Track progress:**
```typescript
prisma.userLessonProgress.findMany({
  where: {
    userId,
    lesson: { courseId }
  },
  select: {
    lessonId: true,
    watchedDurationSec: true,
    completedAt: true
  }
})
```

**Update progress (upsert):**
```typescript
prisma.userLessonProgress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  update: { watchedDurationSec, completedAt },
  create: { userId, lessonId, watchedDurationSec, completedAt }
})
```

### 📂 FILE STRUCTURE
```
src/modules/
├── courses/
│   ├── dto/
│   │   └── course.dto.ts              (7 DTO classes)
│   ├── services/
│   │   └── courses.service.ts         (4 methods)
│   ├── courses.controller.ts          (3 endpoints)
│   └── courses.module.ts
└── lessons/
    ├── dto/
    │   └── lesson.dto.ts              (1 DTO class)
    ├── services/
    │   └── lessons.service.ts         (4 methods)
    ├── lessons.controller.ts          (3 endpoints)
    └── lessons.module.ts

prisma/
└── schema.prisma                       (5 models added)
```

### 🚫 NOT IMPLEMENTED
- Practice module (exercises, submissions, judge0)
- Project module (mini-projects)
- Forum module (Q&A)
- Admin CRUD for courses/lessons
- Analytics/reporting
- Notifications

---

## 📋 VALIDATION RULES

✅ Only enrolled users can access lessons
✅ Only enrolled users can update progress
✅ Duplicate enrollments prevented
✅ Lesson unlock order enforced
✅ watchedDurationSec >= 0
✅ Courses must exist before enrollment
✅ Users cannot access locked lessons

---

## 🔄 DATA FLOW

### User Views Courses
1. User calls `GET /courses` with optional filters
2. CoursesService queries database for courses
3. For each course, checks if user is enrolled
4. Calculates progress if enrolled
5. Returns CourseListDto[] with enrollment and progress

### User Enrolls in Course
1. User calls `POST /courses/:id/enroll`
2. CoursesService checks course exists
3. Checks for duplicate enrollment
4. Creates CourseEnrollment record
5. Returns success response

### User Views Lessons
1. User calls `GET /lessons/course/:courseId`
2. LessonsService checks user is enrolled
3. Gets all lessons ordered by lesson_order
4. Fetches user's progress for each lesson
5. Calculates isLocked status (previous not completed)
6. Returns LessonDto[] with lock and completion status

### User Views Single Lesson
1. User calls `GET /lessons/:id`
2. LessonsService checks user is enrolled
3. Calculates lock status against previous lesson
4. Gets next/previous lesson IDs for split layout
5. Returns LessonDetailDto with full metadata

### User Updates Progress
1. User calls `POST /lessons/:id/progress`
2. LessonsService checks user is enrolled
3. Updates or creates UserLessonProgress record
4. Sets completedAt when completed=true
5. Returns success response

---

## 🎯 FRONTEND INTEGRATION

**Course List Page** (`/courses`)
- Call `GET /courses?status=enrolled` to show enrolled courses
- Call `GET /courses?status=all` to show explore
- Filter by difficulty: `?difficulty=beginner`
- Display: title, category, difficulty, thumbnail, progress, enrolled status

**Course Detail Page** (`/courses/:id`)
- Call `GET /courses/:id` for course info
- Show: title, description, lessons count, progress bar
- Button: "Enroll Now" → `POST /courses/:id/enroll`

**Lessons List Page** (`/courses/:id/learn`)
- Call `GET /lessons/course/:courseId`
- Display lessons in order, with lock indicators
- Show completion status per lesson

**Lesson Detail Page (Split Layout)** (`/lessons/:id`)
- Call `GET /lessons/:id` for lesson content
- Show: title, content (VIDEO/DOCUMENT)
- Use nextLessonId, previousLessonId for navigation
- Call `POST /lessons/:id/progress` to track watched duration
- Call `POST /lessons/:id/progress` with `completed=true` when video ends

---

## 🔧 NEXT STEPS

1. **Database Migration**
   ```bash
   npx prisma migrate dev --name add_courses_lessons
   ```

2. **Seed Database (Optional)**
   ```sql
   INSERT INTO courses (title, description, difficulty, category) VALUES
     ('JavaScript Basics', 'Learn JS from scratch', 'beginner', 'Programming'),
     ('React Advanced', 'Master React patterns', 'advanced', 'Frontend'),
     ('Python for Data', 'Data science with Python', 'intermediate', 'Data');

   INSERT INTO lessons (course_id, title, content_type, lesson_order) VALUES
     (/* course_id */, 'Lesson 1', 'VIDEO', 1),
     (/* course_id */, 'Lesson 2', 'DOCUMENT', 2);
   ```

3. **Test Endpoints**
   ```bash
   # Get courses
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/courses

   # Enroll
   curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/courses/:id/enroll

   # Get lessons
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/lessons/course/:courseId

   # Get lesson
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/lessons/:lessonId

   # Update progress
   curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"watchedDurationSec": 300, "completed": true}' \
     http://localhost:3000/lessons/:lessonId/progress
   ```

---

## 📊 TOTAL FILES CREATED/MODIFIED

**New Files:**
- `src/modules/courses/courses.controller.ts`
- `src/modules/courses/courses.module.ts`
- `src/modules/courses/dto/course.dto.ts`
- `src/modules/courses/services/courses.service.ts`
- `src/modules/lessons/lessons.controller.ts`
- `src/modules/lessons/lessons.module.ts`
- `src/modules/lessons/dto/lesson.dto.ts`
- `src/modules/lessons/services/lessons.service.ts`
- `COURSES_IMPLEMENTATION.md` (this file)

**Modified Files:**
- `prisma/schema.prisma` (added 5 models)
- `src/app.module.ts` (imported 2 new modules)

**Total New Code:** ~800 lines (including docs)
