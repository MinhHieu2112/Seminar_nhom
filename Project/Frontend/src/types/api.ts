// ============================================================
// Shared types — MUST match backend DTOs exactly
// ============================================================

// --- Enums ---
export type UserRole = 'client' | 'admin';

// --- User ---
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

// --- Auth DTOs ---
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LogoutRequest {
  userId: string;
  jti: string;
}

// --- Profile DTOs ---
export interface UpdateProfileRequest {
  timezone?: string;
  preferences?: Record<string, unknown>;
}

// --- Password DTOs ---
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// --- Admin DTOs ---
export interface AdminListUsersResponse {
  data: User[];
  total: number;
}

export interface AdminToggleUserRequest {
  userId: string;
}

// --- API Envelope ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// --- JWT Payload (decoded) ---
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti: string;
  iat: number;
  exp: number;
}
