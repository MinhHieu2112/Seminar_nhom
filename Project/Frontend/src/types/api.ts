// Shared types — must match backend DTOs exactly

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'client' | 'admin';

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  timezone: string;
  preferences: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface RegisterRequest { email: string; password: string; }
export interface LoginRequest { email: string; password: string; }
export interface RefreshRequest { refreshToken: string; }
export interface AuthResponse { accessToken: string; refreshToken: string; user: User; }
export interface LogoutRequest { userId: string; jti: string; }

// ─── Profile DTOs ─────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  timezone?: string;
  preferences?: Record<string, unknown>;
}

// ─── Password DTOs ────────────────────────────────────────────────────────────

export interface ChangePasswordRequest { oldPassword: string; newPassword: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { email: string; otp: string; newPassword: string; }

// ─── Admin DTOs ───────────────────────────────────────────────────────────────

export interface AdminListUsersResponse { data: User[]; total: number; }
export interface AdminToggleUserRequest { userId: string; }

// ─── API envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; };
}

// ─── JWT payload (decoded) ────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
  iat: number;
  exp: number;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'scheduled' | 'done' | 'skipped';
export type TaskType = 'theory' | 'practice' | 'review';
export type TaskSource = 'manual' | 'ai';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: GoalStatus;
  createdAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  durationMin: number;
  priority: number;
  type: TaskType;
  status: TaskStatus;
  source: TaskSource;
  createdAt: string;
  scheduleBlocks?: ScheduleBlock[];
}

export interface ScheduleBlock {
  id: string;
  taskId: string;
  userId: string;
  plannedStart: string;
  plannedEnd: string;
  pomodoroIndex: number;
  status: TaskStatus;
  createdAt: string;
  task?: Pick<Task, 'id' | 'title' | 'durationMin' | 'priority' | 'type'>;
}

export interface CreateGoalRequest { title: string; description?: string; deadline?: string; }
export interface CreateTaskRequest {
  title: string;
  durationMin: number;
  priority?: number;
  type?: TaskType;
}
export interface GenerateScheduleRequest { fromDate?: string; toDate?: string; }

export interface ScheduledBlockDto {
  id: string;
  taskId: string;
  taskTitle: string;
  plannedStart: string;
  plannedEnd: string;
  pomodoroIndex: number;
  status: TaskStatus;
}

export interface ScheduleResult {
  success: boolean;
  scheduled: ScheduledBlockDto[];
  overflow: string[];
  message: string;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type EventSource = 'manual' | 'google' | 'system';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  recurrenceRule: string | null;
  priority: number;
  source: EventSource;
  isAllDay: boolean;
  description: string | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  recurrenceRule?: string;
  priority?: number;
  isAllDay?: boolean;
  source?: EventSource;
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMin: number;
}

export interface WorkingHoursConfig {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  createdAt: string;
  updatedAt: string;
}