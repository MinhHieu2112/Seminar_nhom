# SCHEMA RECONCILIATION CONFLICTS

## CONFLICT SUMMARY

The backend codebase has **8 major conflicts** with the canonical 18-table Supabase schema:

### Conflict 1: User Model Mismatch
- **My Code**: Uses custom `User` model
- **Canonical Schema**: Uses `auth_users` (Supabase auth) + `public_users` (app data)
- **Impact**: Auth service, users service, courses service, lessons service
- **Fixed By**: Switching from `prisma.user` → `prisma.public_users`

### Conflict 2: Field Naming Convention
- **My Code**: Uses camelCase (createdAt, thumbnailUrl, userId, courseId, lessonId, watchedDurationSec)
- **Canonical Schema**: Uses snake_case (created_at, thumbnail_url, user_id, course_id, lesson_id, watched_duration_sec)
- **Impact**: ALL DTOs, ALL services, ALL queries
- **Fixed By**: Updating all Prisma field references and DTO mappings

### Conflict 3: Model Naming Convention
- **My Code**: Uses singular (course, lesson, language)
- **Canonical Schema**: Uses plural (courses, lessons, languages)
- **Impact**: All Prisma queries
- **Fixed By**: Updating all `prisma.course` → `prisma.courses`, etc.

### Conflict 4: Custom User Fields
- **My Code**: `User` has: id, email, username, role, supabaseId, createdAt, updatedAt
- **Canonical Schema**: `public_users` has: id, firebase_uid, email, username, deleted_at, created_at, updated_at
  - No `role` field
  - No `supabaseId` field (but has firebase_uid which is different)
  - Uses `deleted_at` instead of being deleted
- **Impact**: Auth signup flow, user DTOs
- **Fixed By**: Removing role, using auth_users.id as the source of truth

### Conflict 5: Learning Profile Schema
- **My Code**: Custom fields: proficiencyLevel, learningGoal, primaryLanguageId, dailyTimeGoal
- **Canonical Schema**: Fields: current_level, goal, target_language_id, daily_time_goal_minutes, deadline_goal
- **Impact**: Users service, DTOs
- **Fixed By**: Mapping fields correctly (proficiencyLevel → current_level, learningGoal → goal, etc.)

### Conflict 6: Course Enrollments Mismatch
- **My Code**: References `courseEnrollments` and custom relations
- **Canonical Schema**: Table is `course_enrollments` with proper snake_case and Supabase auth foreign keys
- **Impact**: Enrollment queries, progress queries
- **Fixed By**: Using correct table name and field references

### Conflict 7: Lesson Progress Field Name
- **My Code**: `watchedDurationSec`
- **Canonical Schema**: `watched_duration_sec`
- **Impact**: Progress DTOs, service queries
- **Fixed By**: Updating all references to use snake_case

### Conflict 8: Timestamp Fields
- **My Code**: Uses camelCase timestamps (createdAt, updatedAt, completedAt)
- **Canonical Schema**: Uses snake_case (created_at, updated_at) or specific names (completed_at, enrolled_at)
- **Impact**: All DTO serialization, date conversions
- **Fixed By**: Updating all timestamp field references

---

## FILES REQUIRING CHANGES

### Auth Module (5 files)
1. `src/modules/auth/auth.service.ts` - Fix prisma.user → prisma.public_users, field names
2. `src/modules/auth/dto/auth-response.dto.ts` - Update field mappings
3. `src/modules/users/users.service.ts` - Fix user queries and learning profile fields
4. `src/modules/users/dto/user-response.dto.ts` - Update DTO field names
5. `src/modules/users/dto/learning-profile.dto.ts` - Map to correct field names

### Courses Module (4 files)
6. `src/modules/courses/services/courses.service.ts` - Fix all Prisma queries and field names
7. `src/modules/courses/dto/course.dto.ts` - Update DTO field mappings
8. `src/modules/courses/courses.controller.ts` - No changes needed

### Lessons Module (3 files)
9. `src/modules/lessons/services/lessons.service.ts` - Fix all Prisma queries, field names, relations
10. `src/modules/lessons/dto/lesson.dto.ts` - Update DTO field names
11. `src/modules/lessons/lessons.controller.ts` - No changes needed

### Languages Module (1 file)
12. `src/modules/languages/languages.service.ts` - Update field references

### Shared (0 files)
- PrismaService is unchanged

---

## CANONICAL SCHEMA FIELD MAPPING

### public_users (formerly User)
```
id → id (UUID)
email → email
username → username
firebase_uid → firebase_uid (not supabaseId!)
deleted_at → deleted_at
created_at → created_at
updated_at → updated_at
(NO role field - use auth_users for auth)
```

### learning_profiles
```
id → id
user_id → user_id
current_level → current_level (WAS proficiencyLevel)
goal → goal (WAS learningGoal)
target_language_id → target_language_id (WAS primaryLanguageId)
daily_time_goal_minutes → daily_time_goal_minutes (WAS dailyTimeGoal)
deadline_goal → deadline_goal
created_at → created_at
updated_at → updated_at
```

### courses
```
id → id
title → title
description → description
category → category
difficulty → difficulty
thumbnail_url → thumbnail_url (WAS thumbnailUrl)
created_at → created_at
updated_at → updated_at
```

### course_enrollments
```
id → id
user_id → user_id (WAS userId)
course_id → course_id (WAS courseId)
enrolled_at → enrolled_at
```

### lessons
```
id → id
course_id → course_id
title → title
content_type → content_type (WAS contentType)
content_url → content_url (WAS contentUrl)
lesson_order → lesson_order
created_at → created_at
updated_at → updated_at
```

### user_lesson_progress
```
id → id
user_id → user_id
lesson_id → lesson_id
watched_duration_sec → watched_duration_sec (WAS watchedDurationSec)
completed_at → completed_at
created_at → created_at
updated_at → updated_at
```

### languages
```
id → id
name → name
judge0_id → judge0_id
created_at → created_at
updated_at → updated_at
```
