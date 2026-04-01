# COURSE LEARNING BACKEND IMPLEMENTATION

## 1. DATABASE SCHEMA ADDITIONS

```prisma
model Course {
  id            String   @id @default(uuid())
  title         String
  description   String?
  category      String?
  difficulty    String   // beginner, intermediate, advanced
  thumbnailUrl  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  lessons              Lesson[]
  enrollments          CourseEnrollment[]
  userLessonProgress   UserLessonProgress[]

  @@index([difficulty])
  @@index([category])
}

model CourseEnrollment {
  id        String   @id @default(uuid())
  userId    String
  courseId  String
  enrolledAt DateTime @default(now())

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model Lesson {
  id            String   @id @default(uuid())
  courseId      String
  title         String
  contentType   String   // VIDEO or DOCUMENT
  contentUrl    String?
  lessonOrder   Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  course       Course                @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userProgress UserLessonProgress[]

  @@index([courseId])
  @@index([lessonOrder])
}

model UserLessonProgress {
  id                String   @id @default(uuid())
  userId            String
  lessonId          String
  watchedDurationSec Int     @default(0)
  completedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
}

model CourseCategory {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
}
```

---

## 2. DTOs

### Course DTOs

```typescript
// src/modules/courses/dto/course.dto.ts

export class CourseListDto {
  id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: string;
  thumbnailUrl?: string;
  progress?: number;
  enrolled?: boolean;
  created_at: string;
  updated_at: string;
}

export class CourseDetailDto {
  id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty: string;
  thumbnailUrl?: string;
  enrolled: boolean;
  progress?: number;
  lessonsCount: number;
  created_at: string;
  updated_at: string;
}

export class LessonDto {
  id: string;
  courseId: string;
  title: string;
  contentType: string; // VIDEO or DOCUMENT
  contentUrl?: string;
  lessonOrder: number;
  isLocked: boolean;          // locked until previous lesson completed
  isCompleted: boolean;
  watchedDurationSec?: number;
  created_at: string;
  updated_at: string;
}

export class LessonDetailDto {
  id: string;
  courseId: string;
  title: string;
  contentType: string;
  contentUrl?: string;
  lessonOrder: number;
  isLocked: boolean;
  isCompleted: boolean;
  watchedDurationSec?: number;
  nextLessonId?: string;       // for split layout navigation
  previousLessonId?: string;
  created_at: string;
  updated_at: string;
}

export class EnrollCourseDto {
  success: boolean;
  message: string;
}

export class UpdateLessonProgressDto {
  watchedDurationSec?: number;
  completed?: boolean;
  success: boolean;
}

export class CourseFilterDto {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  status?: 'all' | 'enrolled' | 'not-enrolled';
}
```

### Lesson DTOs

```typescript
// src/modules/lessons/dto/lesson.dto.ts

import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateLessonProgressInputDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  watchedDurationSec?: number;

  @IsOptional()
  completed?: boolean;
}
```

---

## 3. SERVICES

### CoursesService

```typescript
@Injectable()
export class CoursesService {
  async getCourses(userId: string, filter?: CourseFilterDto): Promise<CourseListDto[]>
    // Get all courses with enrollment status and progress for user
    // Filter by: difficulty, category, enrollment status
    // Calculate progress: (completedLessons / totalLessons) * 100

  async getCourseById(courseId: string, userId: string): Promise<CourseDetailDto>
    // Get single course detail
    // Include enrollment status and progress for user
    // Include lessons count

  async enrollCourse(userId: string, courseId: string): Promise<EnrollCourseDto>
    // Enroll user in course
    // Check course exists
    // Prevent duplicate enrollment
    // Create CourseEnrollment record

  async getCategories()
    // Get unique course difficulties/categories
}
```

### LessonsService

```typescript
@Injectable()
export class LessonsService {
  async getLessonsByCourse(courseId: string, userId: string): Promise<LessonDto[]>
    // Get all lessons for course ordered by lesson_order
    // Check user is enrolled
    // Include progress for each lesson
    // Calculate isLocked: true if any previous lesson not completed
    // Enforce lesson unlock order

  async getLessonById(lessonId: string, userId: string): Promise<LessonDetailDto>
    // Get single lesson detail
    // Check user is enrolled
    // Include progress
    // Include isLocked status
    // Include nextLessonId and previousLessonId for split layout

  async updateLessonProgress(
      userId: string,
      lessonId: string,
      updateDto: UpdateLessonProgressInputDto
    ): Promise<UpdateLessonProgressDto>
    // Update watchedDurationSec and/or completed status
    // Check user is enrolled
    // Upsert UserLessonProgress record
    // Set completedAt when completed = true

  private getUserProgress(userId: string, courseId: string)
    // Build progress map for all lessons in course
}
```

---

## 4. CONTROLLERS

### CoursesController

```typescript
@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  @Get()
  async getCourses(
    @CurrentUser() user: any,
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  )
    // GET /courses?difficulty=beginner&status=enrolled

  @Get(':id')
  async getCourseById(@Param('id') courseId: string, @CurrentUser() user: any)
    // GET /courses/:id

  @Post(':id/enroll')
  @HttpCode(201)
  async enrollCourse(@Param('id') courseId: string, @CurrentUser() user: any)
    // POST /courses/:id/enroll
}
```

### LessonsController

```typescript
@Controller('lessons')
@UseGuards(AuthGuard)
export class LessonsController {
  @Get('course/:courseId')
  async getLessonsByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  )
    // GET /lessons/course/:courseId

  @Get(':id')
  async getLessonById(@Param('id') lessonId: string, @CurrentUser() user: any)
    // GET /lessons/:id

  @Post(':id/progress')
  @HttpCode(200)
  async updateLessonProgress(
    @Param('id') lessonId: string,
    @Body() updateDto: UpdateLessonProgressInputDto,
    @CurrentUser() user: any,
  )
    // POST /lessons/:id/progress
    // Body: { watchedDurationSec?: number, completed?: boolean }
}
```

---

## 5. API CONTRACT MAP

### COURSES ENDPOINTS

```
GET /courses
  Query Params:
    - difficulty: 'beginner' | 'intermediate' | 'advanced' (optional)
    - category: string (optional)
    - status: 'all' | 'enrolled' | 'not-enrolled' (optional)

  Response: CourseListDto[]
  [
    {
      id: "uuid",
      title: "JavaScript Basics",
      description: "Learn JS from scratch",
      category: "Programming",
      difficulty: "beginner",
      thumbnailUrl: "https://...",
      progress: 50,
      enrolled: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    ...
  ]
```

```
GET /courses/:id
  Response: CourseDetailDto
  {
    id: "uuid",
    title: "JavaScript Basics",
    description: "Learn JS from scratch",
    category: "Programming",
    difficulty: "beginner",
    thumbnailUrl: "https://...",
    enrolled: true,
    progress: 50,
    lessonsCount: 10,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
```

```
POST /courses/:id/enroll
  Response: EnrollCourseDto
  {
    success: true,
    message: "Successfully enrolled in course"
  }
```

### LESSONS ENDPOINTS

```
GET /lessons/course/:courseId
  Response: LessonDto[]
  [
    {
      id: "uuid",
      courseId: "uuid",
      title: "Lesson 1: Basics",
      contentType: "VIDEO",
      contentUrl: "https://youtube.com/...",
      lessonOrder: 1,
      isLocked: false,
      isCompleted: true,
      watchedDurationSec: 600,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "uuid",
      courseId: "uuid",
      title: "Lesson 2: Advanced",
      contentType: "DOCUMENT",
      contentUrl: "https://docs.example.com/...",
      lessonOrder: 2,
      isLocked: false,
      isCompleted: false,
      watchedDurationSec: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    ...
  ]
```

```
GET /lessons/:id
  Response: LessonDetailDto
  {
    id: "uuid",
    courseId: "uuid",
    title: "Lesson 1: Basics",
    contentType: "VIDEO",
    contentUrl: "https://youtube.com/...",
    lessonOrder: 1,
    isLocked: false,
    isCompleted: true,
    watchedDurationSec: 600,
    nextLessonId: "uuid-of-lesson-2",
    previousLessonId: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
```

```
POST /lessons/:id/progress
  Body: UpdateLessonProgressInputDto
  {
    watchedDurationSec: 300,
    completed: true
  }

  Response: UpdateLessonProgressDto
  {
    success: true
  }
```

---

## 6. PRISMA QUERIES

```typescript
// List courses with enrollment status
await prisma.course.findMany({
  where: { difficulty: 'beginner' },
  include: {
    enrollments: {
      where: { userId },
      take: 1,
    },
    lessons: {
      select: { id: true },
    },
  },
  orderBy: { createdAt: 'desc' },
});

// Get course detail
await prisma.course.findUnique({
  where: { id: courseId },
  include: {
    enrollments: {
      where: { userId },
      take: 1,
    },
    lessons: {
      select: { id: true },
    },
  },
});

// Create enrollment
await prisma.courseEnrollment.create({
  data: {
    userId,
    courseId,
  },
});

// Get lessons ordered by lesson_order
await prisma.lesson.findMany({
  where: { courseId },
  orderBy: { lessonOrder: 'asc' },
});

// Get lesson progress
await prisma.userLessonProgress.findMany({
  where: {
    userId,
    lesson: {
      courseId,
    },
  },
  select: {
    lessonId: true,
    watchedDurationSec: true,
    completedAt: true,
  },
});

// Count completed lessons
await prisma.userLessonProgress.count({
  where: {
    userId,
    lesson: {
      courseId,
    },
    completedAt: { not: null },
  },
});

// Upsert lesson progress
await prisma.userLessonProgress.upsert({
  where: {
    userId_lessonId: { userId, lessonId },
  },
  update: {
    watchedDurationSec,
    completedAt,
  },
  create: {
    userId,
    lessonId,
    watchedDurationSec,
    completedAt,
  },
});
```

---

## 7. FEATURES IMPLEMENTED

✅ **List Courses**
   - Filter by difficulty (beginner, intermediate, advanced)
   - Filter by category
   - Filter by enrollment status (all, enrolled, not-enrolled)
   - Include progress percentage for enrolled courses
   - Show enrollment status

✅ **Get Course Detail**
   - Course info with lessons count
   - Current user enrollment status
   - Progress percentage if enrolled

✅ **Enroll Course**
   - Create course enrollment record
   - Prevent duplicate enrollments
   - Return success message

✅ **Get Lessons by Course**
   - Lessons ordered by lesson_order (enforced)
   - Support both VIDEO and DOCUMENT content types
   - Include lock status (based on previous lesson completion)
   - Include completion status per user
   - Include watched duration

✅ **Get Lesson Detail**
   - Single lesson with full details
   - Lock status calculation
   - Next/Previous lesson IDs (for split layout navigation)
   - User progress data

✅ **Update Lesson Progress**
   - Track watched duration in seconds
   - Mark lesson as completed
   - Upsert progress records

✅ **Lesson Unlock Order**
   - First lesson always unlocked
   - Subsequent lessons locked until previous completed
   - isLocked flag in response
   - Enforced in service layer

✅ **Frontend Split Layout Support**
   - Lesson detail includes nextLessonId and previousLessonId
   - API returns all data needed for split panel view

---

## 8. VALIDATION RULES

- Lesson progress can only be updated by enrolled users
- Lessons can only be accessed by enrolled users
- Courses can only be enrolled once per user
- watchedDurationSec must be >= 0
- Lesson unlock enforced programmatically

---

## 9. FILE STRUCTURE

```
src/modules/
├── courses/
│   ├── dto/
│   │   └── course.dto.ts
│   ├── services/
│   │   └── courses.service.ts
│   ├── courses.controller.ts
│   └── courses.module.ts
└── lessons/
    ├── dto/
    │   └── lesson.dto.ts
    ├── services/
    │   └── lessons.service.ts
    ├── lessons.controller.ts
    └── lessons.module.ts
```

---

## 10. DEPENDENCIES

- Already installed in package.json
- No additional dependencies needed

---

## 11. NOT IMPLEMENTED

❌ Practice module (exercises, submissions, judge0)
❌ Project module (mini-projects, stages)
❌ Forum module (questions, answers)
❌ Admin CRUD for courses/lessons
