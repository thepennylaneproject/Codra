// ============================================================
// CODRA FORGOT PASSWORD FORM
// src/components/auth/ForgotPasswordForm.tsx
// Password reset request form
// ============================================================

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

// Icons
const Icons = {
  Mail: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-6 7h18" />
    </svg>
  ),
  Activity: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

// ============================================================
// Success State
// ============================================================

interface SuccessStateProps {
  email: string;
}

function SuccessState({ email }: SuccessStateProps) {
  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Icons.CheckCircle />
      </div>

      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Check your email</h2>
      <p className="text-zinc-400 mb-6">
        We&apos;ve sent a password reset link to<br />
        <span className="text-zinc-200 font-medium">{email}</span>
      </p>

      <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-left mb-6">
        <p className="text-sm text-zinc-400">
          Click the link in the email to reset your password. The link will expire in 24 hours.
          If you don&apos;t see the email, check your spam folder.
        </p>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
      >
        <Icons.ArrowLeft />
        Open login
      </Link>
    </div>
  );
}

// ============================================================
// Forgot Password Form
// ============================================================

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { success, error: resetError } = await resetPassword(email);

      if (!success && resetError) {
        setError(resetError);
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      setError('Unexpected error. Retry.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, resetPassword]);

  // Show success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <SuccessState email={email} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Icons.Activity />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">Codra</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Forgot your password?</h2>
          <p className="text-zinc-500">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <Icons.AlertCircle />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Email address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Icons.Mail />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
                className="
                  w-full px-4 py-3 pl-12 rounded-xl
                  bg-zinc-900/50 border border-zinc-800
                  text-zinc-100 placeholder-zinc-600
                  hover:border-zinc-700 focus:border-indigo-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !email}
            className="
              w-full py-3 px-4 rounded-xl font-medium
              bg-zinc-900 text-white
              hover:bg-zinc-800
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {isSubmitting ? (
              <>
                <Icons.Loader />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            <Icons.ArrowLeft />
            Open login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
