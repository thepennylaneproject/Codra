// ============================================================
// CODRA AUTH CALLBACK PAGE
// src/pages/auth/AuthCallback.tsx
// Handles OAuth and magic link callbacks
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/api/auth';
import { Button } from '@/components/ui/Button';

// ============================================================
// Loading State
// ============================================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 animate-pulse" />
          <div
            className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-zinc-600/40 animate-spin"
            style={{ animationDuration: '3s' }}
          />
        </div>

        <div className="text-center">
          <h2 className="text-base font-medium text-zinc-200 mb-2">Completing sign in...</h2>
          <p className="text-sm text-zinc-500">Verifying credentials.</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Error State
// ============================================================

interface ErrorStateProps {
  error: string;
  description?: string;
  onRetry: () => void;
}

function ErrorState({ error, description, onRetry }: ErrorStateProps) {
  const navigate = useNavigate();

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, { title: string; message: string }> = {
    access_denied: {
      title: 'Access Denied',
      message: 'You cancelled the sign-in process or access was denied by the provider.',
    },
    server_error: {
      title: 'Server Error',
      message: 'Server error. Retry.',
    },
    missing_code: {
      title: 'Invalid Callback',
      message: 'Invalid authentication callback. Retry sign-in.',
    },
    invalid_request: {
      title: 'Invalid Request',
      message: 'Invalid authentication request. Retry.',
    },
    default: {
      title: 'Authentication Failed',
      message: description || 'Sign-in failed. Retry.',
    },
  };

  const { title, message } = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
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

        <h1 className="text-xl font-semibold text-zinc-100 mb-2">{title}</h1>
        <p className="text-zinc-400 mb-8">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium bg-zinc-800 text-zinc-100 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Retry
          </Button>
          <Button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all"
          >
            Open login
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Auth Callback Page
// ============================================================

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorDescription, setErrorDescription] = useState<string | undefined>();

  useEffect(() => {
    const handleCallback = async () => {
      // Check for errors in URL
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');
      
      if (errorParam) {
        setError(errorParam);
        setErrorDescription(errorDesc || undefined);
        return;
      }

      try {
        // Let Supabase handle the OAuth code exchange
        // Supabase detects the auth callback automatically
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) {
          console.error('Auth callback error:', authError);
          setError('server_error');
          setErrorDescription(authError.message);
          return;
        }

        if (data.session) {
          // Successfully authenticated
          const returnTo = searchParams.get('returnTo') || '/';
          navigate(decodeURIComponent(returnTo), { replace: true });
        } else {
          // No session - might be a magic link or email confirmation
          // Check for type parameter
          const type = searchParams.get('type');
          
          if (type === 'recovery') {
            // Password recovery - redirect to reset password page
            navigate('/reset-password', { replace: true });
          } else if (type === 'signup') {
            // Email confirmation - redirect to login with success message
            navigate('/login?confirmed=true', { replace: true });
          } else {
            // No session and no specific type - redirect to login
            navigate('/login', { replace: true });
          }
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setError('server_error');
      }
    };

    // Small delay to ensure Supabase has processed the URL
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  const handleRetry = () => {
    setError(null);
    setErrorDescription(undefined);
    navigate('/login');
  };

  if (error) {
    return <ErrorState error={error} description={errorDescription} onRetry={handleRetry} />;
  }

  return <LoadingState />;
}

export default AuthCallback;
