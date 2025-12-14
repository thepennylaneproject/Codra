// ============================================================
// CODRA AUTH TYPES
// src/lib/api/auth.types.ts
// ============================================================

import type { User, Session, AuthError } from '@supabase/supabase-js';

// ============================================================
// User Types
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  timezone: string;
  preferences: UserPreferences;
  plan: UserPlan;
  planStartedAt: Date | null;
  planExpiresAt: Date | null;
  onboardingCompleted: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultEnvironment: 'development' | 'staging' | 'production';
  notifications: {
    email: boolean;
    quotaAlerts: boolean;
    weeklyDigest: boolean;
  };
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
  };
}

export type UserPlan = 'free' | 'pro' | 'team' | 'enterprise';

// ============================================================
// Auth Request/Response Types
// ============================================================

export interface SignupData {
  email: string;
  password: string;
  metadata?: {
    fullName?: string;
    company?: string;
    inviteCode?: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ProfileUpdateData {
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  company?: string;
  jobTitle?: string;
  timezone?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthResponse<T = UserProfile> {
  data: T | null;
  error: AuthError | Error | null;
}

export interface SessionResponse {
  session: Session | null;
  user: User | null;
}

// ============================================================
// Auth State Types
// ============================================================

export type AuthStatus = 
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  error: Error | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'INITIAL_SESSION';

export type AuthStateChangeCallback = (
  event: AuthEvent,
  session: Session | null
) => void | Promise<void>;

// ============================================================
// OAuth Types
// ============================================================

export type OAuthProvider = 'google' | 'github' | 'discord';

export interface OAuthOptions {
  provider: OAuthProvider;
  redirectTo?: string;
  scopes?: string;
}

// ============================================================
// Error Types
// ============================================================

export class AuthenticationError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.status = status;
  }
}

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_NOT_FOUND: 'user_not_found',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  SESSION_EXPIRED: 'session_expired',
  PASSWORD_TOO_WEAK: 'password_too_weak',
  EMAIL_TAKEN: 'email_taken',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  UNKNOWN: 'unknown_error',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
