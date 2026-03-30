# Codex Admin System - Setup Guide

## System Overview

The Codex platform now includes a complete admin system for managing content, users, and platform analytics.

### Admin Features Implemented

#### 1. Admin Monitoring System
- **Dashboard** (`/admin/dashboard`): Real-time analytics with key metrics
  - Total users, courses, submissions, success rate, active users
  - Quick action buttons to access management pages
  - System status indicators

- **User Management** (`/admin/users`): Full user administration
  - View all users with sortable/filterable table
  - Display user role (USER/ADMIN), email, join date
  - Pagination support (15 users per page)

- **Forum Moderation** (`/admin/forum`): Content moderation tools
  - Review forum threads with status indicators
  - Flag inappropriate content
  - Delete threads with confirmation dialog
  - Search and filter by status, date range

#### 2. Admin Content Management
- **Courses** (`/admin/courses`): Manage all courses
  - Create new courses
  - View course metrics (difficulty, lesson count, enrollment)
  - Edit/delete courses (placeholder for CRUD)

- **Exercises** (`/admin/exercises`): Exercise management
  - Create coding exercises
  - Manage test cases
  - View acceptance rates and language distribution

- **Projects** (`/admin/projects`): Project management
  - Create mini-projects
  - Manage project stages
  - Track project metrics and completion rates

- **Analytics** (`/admin/analytics`): Advanced analytics
  - User engagement metrics
  - Content performance analytics
  - Submission trends and language popularity
  - Revenue and usage statistics

#### 3. Admin Navigation
- **AdminNavbar**: Top navigation with user profile and logout
- **AdminSidebar**: Collapsible sidebar with 7 admin sections
  - Dashboard, Users, Courses, Exercises, Projects, Forum, Analytics

#### 4. Role-Based Access Control
- Admin routes require `ADMIN` role to access
- Non-admin users automatically redirected to `/dashboard`
- Role check in `AuthContext` with `isAdmin` flag
- Protected `/(admin)` layout wrapper

---

## UI Components Refactored

### Form Components
- **FormField**: Reusable form field with label, error display, and hints
- **SelectField**: Dropdown with filtering and custom options
- **TextareaField**: Multi-line text input with character counter
- **FileUploadField**: Drag-drop file upload with validation

### Data Display Components
- **DataTable**: Sortable, filterable table with pagination
  - Supports custom cell rendering
  - Per-column sorting controls
  - Configurable page size
  - Empty state handling

- **TablePagination**: Pagination controls with page info

### Dialog Components
- **ConfirmDialog**: Confirmation modal for destructive actions
  - Destructive action styling (red background)
  - Loading state handling
  - Optional custom content

### Layout Components
- **PageHeader**: Consistent header with title, description, breadcrumbs, and action button
- **PageContainer**: Max-width container with responsive padding
- **AdminLayout**: Role-protected layout with navbar and sidebar

### Loader Components
- **SkeletonLoader**: Configurable skeleton loading placeholders
- **TableSkeleton**: Table-specific skeleton loader

---

## File Structure

```
/components/shared
  /forms
    FormField.tsx
    SelectField.tsx
    TextareaField.tsx
    FileUploadField.tsx
  /tables
    DataTable.tsx
    TablePagination.tsx
  /dialogs
    ConfirmDialog.tsx
  /layouts
    PageHeader.tsx
    PageContainer.tsx
  /loaders
    SkeletonLoader.tsx
  /admin
    AdminNavbar.tsx
    AdminSidebar.tsx

/app/(admin)
  /layout.tsx                    # Role-protected admin layout
  /dashboard
    /page.tsx
  /users
    /page.tsx
  /courses
    /page.tsx
  /exercises
    /page.tsx
  /projects
    /page.tsx
  /forum
    /page.tsx
  /analytics
    /page.tsx

/services
  adminService.ts                # Admin API calls (users, analytics, forum)
```

---

## Creating Admin Users

To test the admin system, you need to create an admin user in your Supabase database:

1. Go to your Supabase dashboard
2. Navigate to the `users` table
3. Manually update any user's `role` field from `'USER'` to `'ADMIN'`
4. Alternatively, run this SQL query:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## Environment Variables Required

For the app to work properly, ensure these environment variables are set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Set these in your Vercel project settings under **Vars** section.

---

## Admin API Service

The `adminService.ts` provides methods for:

- **User Management**
  - `getUsers(limit, offset)` - Fetch paginated users
  - `getUserCount()` - Get total user count
  - `getUserDetail(userId)` - Get user with stats
  - `updateUserRole(userId, role)` - Change user role

- **Analytics**
  - `getAnalyticsDashboard()` - Get dashboard metrics
  - (Can extend with more detailed analytics)

- **Forum Moderation**
  - `getForumThreads(limit, offset)` - Get threads
  - `getForumThreadDetail(threadId)` - Get thread with replies
  - `updateForumThreadStatus(threadId, status)` - Update thread status

---

## Design System

All admin components follow the **Cosmic Night** theme:
- **Primary Background**: `#0f172a` (slate-950)
- **Secondary Background**: `#1e293b` (slate-800)
- **Primary Accent**: `#a855f7` (purple-500)
- **Text Primary**: `#e2e8f0` (slate-200)
- **Text Secondary**: `#cbd5e1` (slate-400)

Status colors:
- **Active/Success**: Green (`#10b981`)
- **Warning/Pending**: Yellow (`#eab308`)
- **Error/Danger**: Red (`#ef4444`)
- **Info**: Blue (`#3b82f6`)

---

## Next Steps

1. Set your Supabase environment variables
2. Create an admin user in the database
3. Log in with your admin account
4. Navigate to `/admin/dashboard` to see the admin panel
5. Implement actual CRUD operations for courses/exercises/projects (currently placeholders)
6. Add more detailed analytics visualizations using Recharts

---

## Testing the Admin System

1. **Login Flow**:
   - Sign up or sign in with your account
   - Non-admin users see normal dashboard
   - Admin users can access `/admin/dashboard`

2. **Admin Dashboard**:
   - View platform metrics
   - See active users and submission stats
   - Access quick action buttons

3. **User Management**:
   - View all registered users
   - Sort by username, email, role
   - Pagination works across pages

4. **Forum Moderation**:
   - View all forum threads
   - See flagged threads highlighted
   - Delete threads with confirmation

5. **Content Management**:
   - Navigate to courses/exercises/projects sections
   - See CRUD interface structure
   - (Full implementation can be extended as needed)
