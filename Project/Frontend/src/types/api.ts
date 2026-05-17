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
  name: string | null;
  avatar: string | null;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  phone: string | null;
  coverPhoto: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  googleId?: string | null;
  githubId?: string | null;
  discordId?: string | null;
  linkedinId?: string | null;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
export interface LoginRequest { email: string; password: string; }
export interface RefreshRequest { refreshToken: string; }
export interface AuthResponse { accessToken: string; refreshToken: string; user: User; }
export interface LogoutRequest { userId: string; jti: string; }

// ─── Profile DTOs ─────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  timezone?: string;
  preferences?: Record<string, unknown>;
  country?: string;
  city?: string;
  postalCode?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  phone?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
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
export type BlockStatus = 'planned' | 'done' | 'missed' | 'shifted';
export type TaskType = 'theory' | 'practice' | 'review';
export type TaskSource = 'manual' | 'ai';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  tasks?: Task[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploader?: User | null;
}

export interface Task {
  id: string;
  userId: string;
  groupId?: string | null;
  assigneeId?: string | null;
  title: string;
  description?: string | null;
  dueTime?: string | null;
  subjectId?: string | null;
  priority?: number;
  status: TaskStatus;
  submittedForReview?: boolean;
  createdAt: string;
  subject?: Pick<Subject, 'id' | 'name' | 'categoryId'>;
  group?: Pick<Group, 'id' | 'name' | 'creatorId'> | null;
  attachments?: TaskAttachment[];
  leaderComments?: string | null;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  groupId?: string | null;
  subjectId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  createdAt: string;
  updatedAt: string;
  subject?: Pick<Subject, 'id' | 'name' | 'categoryId'>;
  group?: Pick<Group, 'id' | 'name'> | null;
}

export interface ScheduleBlock {
  id: string;
  taskId: string;
  userId: string;
  plannedStart: string;
  plannedEnd: string;
  pomodoroIndex: number;
  sessionType?: 'morning' | 'afternoon' | 'evening' | null;
  queueOrder?: number | null;
  status: BlockStatus;
  createdAt: string;
  task?: Pick<Task, 'id' | 'title' | 'priority'>;
}

export interface Allocation {
  id: string;
  startTime: string;
  durationMinutes?: number;
  task?: Pick<Task, 'id' | 'title'>;
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
  status: BlockStatus;
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
  taskId: string | null;
  pomodoroIndex: number | null;
  sessionType: 'morning' | 'afternoon' | 'evening' | null;
  queueOrder: number | null;
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
  externalId?: string;
  taskId?: string;
  pomodoroIndex?: number;
  sessionType?: 'morning' | 'afternoon' | 'evening';
  queueOrder?: number;
}

export interface FreeSlot {
  start: string;
  end: string;
  durationMin: number;
}


// ─── Analytics ───────────────────────────────────────────────────────────────

export interface TimeDistribution {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface TimeBreakdownPoint {
  label: string;
  minutes: number;
  percentage: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  reviewing?: number;
}

export interface AnalyticsSummary {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  individualTasks: TaskStats;
  teamTasks: TaskStats;
  plannedBlocks: number;
  completedBlocks: number;
  totalStudyMins: number;
}

export interface TeamworkStats {
  pendingInvitations: number;
  activeGroupTasks: number;
  collaboratorsCount: number;
  waitingResponseTasks: number;
}

export interface NextDeadline {
  title: string;
  dueTime: string;
  priority: number;
}

export interface WeeklyOverview {
  scheduledBlocks: number;
  studyHours: number;
  completedTasks: number;
}

export interface TeamContributionPoint {
  name: string;
  tasks: number;
  hours: number;
}

export interface BurndownPoint {
  day: string;
  remaining: number;
  ideal: number;
}

export interface PerformanceMetricPoint {
  metric: string;
  value: number;
}

export interface PendingApprovalItem {
  id: string;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

export interface AnalyticsDashboard {
  completionRate: number;
  productivityScore: number;
  timeDistribution: TimeDistribution;
  timeBreakdown: TimeBreakdownPoint[];
  suggestions: string[];
  summary: AnalyticsSummary;
  weeklyOverview: WeeklyOverview;
  teamwork: TeamworkStats;
  teamContribution: TeamContributionPoint[];
  burndown: BurndownPoint[];
  performance: PerformanceMetricPoint[];
  pendingApprovals: PendingApprovalItem[];
  nextDeadline?: NextDeadline;
}

export interface AnalyticsHistoryPoint {
  date: string;
  planned: number;
  actual: number;
  tasksCompleted?: number;
  tasksPending?: number;
  tasksOverdue?: number;
}

// ─── Teamwork (Groups) ────────────────────────────────────────────────────────

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  _count?: {
    members: number;
  };
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
}

export interface AddMemberDto {
  userId: string;
  role?: string;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  userId: string;
  inviterId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  group?: Pick<Group, 'id' | 'name' | 'description'>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  taskId?: string | null;
  task?: {
    id: string;
    title: string;
    groupId?: string | null;
    groupName?: string | null;
  } | null;
  status: 'unread' | 'read';
  createdAt: string;
  updatedAt: string;
}

export type GroupMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'STICKER';

export interface GroupMessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface GroupMessageSticker {
  id: string;
  messageId: string;
  stickerId: string;
  stickerUrl: string;
  packName?: string | null;
}

export interface GroupMessageMention {
  id: string;
  messageId: string;
  mentionedUserId: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  taskId?: string | null;
  senderId: string;
  content: string;
  messageType: GroupMessageType;
  createdAt: string;
  attachments?: GroupMessageAttachment[];
  mentions?: GroupMessageMention[];
  sticker?: GroupMessageSticker | null;
  sender?: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
}

export interface PaginatedMessages {
  messages: GroupMessage[];
  nextCursor?: string;
}
