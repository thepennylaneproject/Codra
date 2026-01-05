// ============================================================
// CODRA PROTECTED ROUTE
// src/components/auth/ProtectedRoute.tsx
// Route guard component for authenticated routes
// ============================================================

import React, { useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import type { UserPlan } from '../../lib/api/auth.types';
import { Button } from '@/components/ui/Button';

// ============================================================
// Loading Spinner (matches Codra dark theme)
// ============================================================

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Codra Logo Spinner */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 animate-pulse" />
          <div
            className="absolute inset-0 w-12 h-12 rounded-xl border-2 border-zinc-600/40 animate-spin"
            style={{ animationDuration: '2s' }}
          />
        </div>
        <div className="text-zinc-500 text-sm font-medium">Loading...</div>
      </div>
    </div>
  );
}

// ============================================================
// Unauthorized Page
// ============================================================

interface UnauthorizedProps {
  message?: string;
  requiredPlan?: UserPlan;
}

function Unauthorized({ message, requiredPlan }: UnauthorizedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-xl font-semibold text-zinc-100 mb-2">Access Denied</h1>
        <p className="text-zinc-500 mb-6">
          {message || 'You don\'t have permission to access this page.'}
        </p>

        {/* Upgrade prompt for plan restrictions */}
        {requiredPlan && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-sm text-zinc-400 mb-3">
              This feature requires a <span className="text-indigo-400 font-medium capitalize">{requiredPlan}</span> plan.
            </p>
            <Button
              onClick={() => navigate('/settings/billing')}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all"
            >
              Open billing settings
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            Open previous page
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium bg-zinc-800 text-zinc-100 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Open home
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Protected Route Props
// ============================================================

interface ProtectedRouteProps {
  children: ReactNode;
  
  /** Redirect path when not authenticated */
  redirectTo?: string;
  
  /** Required user plans to access this route */
  requiredPlans?: UserPlan[];
  
  /** Custom check function for additional authorization */
  checkAccess?: () => boolean | Promise<boolean>;
  
  /** Show custom loading component */
  loadingComponent?: ReactNode;
  
  /** Show custom unauthorized component */
  unauthorizedComponent?: ReactNode;
  
  /** Require onboarding to be completed */
  requireOnboarding?: boolean;
  
  /** Skip redirect and show unauthorized page instead */
  showUnauthorized?: boolean;
}

// ============================================================
// Protected Route Component
// ============================================================

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requiredPlans,
  checkAccess,
  loadingComponent,
  unauthorizedComponent,
  requireOnboarding = false,
  showUnauthorized = false,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated, profile } = useAuth();

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !showUnauthorized) {
      // Preserve the intended destination
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`${redirectTo}?returnTo=${returnTo}`, { replace: true });
    }
  }, [isLoading, isAuthenticated, showUnauthorized, navigate, redirectTo, location]);

  // Handle onboarding redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated && requireOnboarding && profile && !profile.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoading, isAuthenticated, requireOnboarding, profile, navigate]);

  // Loading state
  if (isLoading) {
    return <>{loadingComponent || <LoadingSpinner />}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (showUnauthorized) {
      return <>{unauthorizedComponent || <Unauthorized message="Authentication required to access this page." />}</>;
    }
    // Redirect handled by useEffect
    return <>{loadingComponent || <LoadingSpinner />}</>;
  }

  // Check plan requirements
  if (requiredPlans && requiredPlans.length > 0 && profile) {
    if (!requiredPlans.includes(profile.plan)) {
      return (
        <>
          {unauthorizedComponent || (
            <Unauthorized 
              message={`This feature requires a ${requiredPlans[0]} plan or higher.`}
              requiredPlan={requiredPlans[0]}
            />
          )}
        </>
      );
    }
  }

  // Custom access check
  if (checkAccess) {
    const hasAccess = checkAccess();
    
    // Handle async check
    if (hasAccess instanceof Promise) {
      // For async checks, we'd need additional state management
      // For now, this is synchronous only
      console.warn('Async checkAccess is not fully supported. Consider using synchronous checks.');
    } else if (!hasAccess) {
      return <>{unauthorizedComponent || <Unauthorized />}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// ============================================================
// Higher-Order Component Alternative
// ============================================================

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// ============================================================
// Role-Based Route Variant
// ============================================================

interface RoleBasedRouteProps extends Omit<ProtectedRouteProps, 'requiredPlans'> {
  allowedPlans: UserPlan[];
}

export function RoleBasedRoute({ allowedPlans, ...props }: RoleBasedRouteProps) {
  return <ProtectedRoute requiredPlans={allowedPlans} {...props} />;
}

// ============================================================
// Guest Route (redirect if authenticated)
// ============================================================

interface GuestRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function GuestRoute({ children, redirectTo = '/' }: GuestRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Check for returnTo parameter
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo');
      navigate(returnTo ? decodeURIComponent(returnTo) : redirectTo, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo, location.search]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

// ============================================================
// Exports
// ============================================================

export { LoadingSpinner, Unauthorized };
export type { ProtectedRouteProps, GuestRouteProps, RoleBasedRouteProps };
