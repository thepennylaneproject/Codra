// ============================================================
// CODRA RESET PASSWORD FORM
// src/components/auth/ResetPasswordForm.tsx
// Set new password after receiving reset link
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

// Icons
const Icons = {
  Eye: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Activity: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

// ============================================================
// Password Strength Indicator
// ============================================================

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    if (metCount === 0) return { level: 0, label: '', color: '' };
    if (metCount === 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (metCount === 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' };
    if (metCount === 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
    return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  }, [requirements]);

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                level <= strength.level ? strength.color : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
        {strength.label && (
          <span className={`text-xs font-medium ${
            strength.level >= 3 ? 'text-emerald-400' : 
            strength.level >= 2 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {strength.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {requirements.map((req, idx) => (
          <div 
            key={idx}
            className={`flex items-center gap-2 text-xs transition-colors ${
              req.met ? 'text-emerald-400' : 'text-zinc-600'
            }`}
          >
            {req.met ? <Icons.Check /> : <Icons.X />}
            {req.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Success State
// ============================================================

function SuccessState() {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Icons.CheckCircle />
      </div>

      <h2 className="text-xl font-semibold text-zinc-100 mb-2">Password updated.</h2>
      <p className="text-zinc-400 mb-8">
        Password reset complete. Sign in with the new password.
      </p>

      <Button
        onClick={() => navigate('/login')}
        className="
          px-6 py-3 rounded-xl font-medium
          bg-zinc-900 text-white
          hover:bg-zinc-800
          transition-all duration-200
        "
      >
        Open login
      </Button>
    </div>
  );
}

// ============================================================
// Reset Password Form
// ============================================================

export function ResetPasswordForm() {
  const { updatePassword } = useAuth();

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Password validation
  const isPasswordValid = useMemo(() => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  }, [password]);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet strength requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { success, error: updateError } = await updatePassword(password);

      if (!success && updateError) {
        setError(updateError);
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      setError('Unexpected error. Retry.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, isPasswordValid, passwordsMatch, updatePassword]);

  // Show success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <SuccessState />
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
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Set new password</h2>
          <p className="text-zinc-500">
            Choose a strong password for your account.
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
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              New password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Icons.Lock />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                autoFocus
                className="
                  w-full px-4 py-3 pl-12 pr-12 rounded-xl
                  bg-zinc-900/50 border border-zinc-800
                  text-zinc-100 placeholder-zinc-600
                  hover:border-zinc-700 focus:border-indigo-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </Button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Confirm password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Icons.Lock />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                className={`
                  w-full px-4 py-3 pl-12 pr-12 rounded-xl
                  bg-zinc-900/50 border
                  text-zinc-100 placeholder-zinc-600
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  ${confirmPassword && !passwordsMatch 
                    ? 'border-red-500/50 focus:border-red-500' 
                    : confirmPassword && passwordsMatch
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-zinc-800 hover:border-zinc-700 focus:border-indigo-500'
                  }
                `}
              />
              <Button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </Button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <Icons.AlertCircle />
                Passwords do not match
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="text-sm text-emerald-400 flex items-center gap-1">
                <Icons.Check />
                Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
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
                Updating password...
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            Open login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
