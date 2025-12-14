// ============================================================
// CODRA RESET PASSWORD FORM
// src/components/auth/ResetPasswordForm.tsx
// Set new password after receiving reset link
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';

import { Eye, EyeOff, Lock, Loader2, AlertCircle, Check, X, CheckCircle, Activity } from 'lucide-react';


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
              className={`flex-1 h-full rounded-full transition-all duration-300 ${level <= strength.level ? strength.color : 'bg-zinc-800'
                }`}
            />
          ))}
        </div>
        {strength.label && (
          <span className={`text-xs font-medium ${strength.level >= 3 ? 'text-emerald-400' :
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
            className={`flex items-center gap-2 text-xs transition-colors ${req.met ? 'text-emerald-400' : 'text-zinc-600'
              }`}
          >
            {req.met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>

      <h2 className="text-2xl font-semibold text-text-primary mb-2">Password updated!</h2>
      <p className="text-text-soft mb-8">
        Your password has been successfully reset. You can now sign in with your new password.
      </p>

      <button
        onClick={() => navigate('/login')}
        className="
          px-6 py-3 rounded-xl font-medium
          bg-gradient-to-r from-indigo-500 to-purple-600 text-white
          hover:from-indigo-600 hover:to-purple-700
          transition-all duration-200
        "
      >
        Continue to login
      </button>
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
      setError('Please choose a stronger password.');
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
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, isPasswordValid, passwordsMatch, updatePassword]);

  // Show success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background-default flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <SuccessState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-default flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Codra</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Set new password</h2>
          <p className="text-text-muted">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              New password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <Lock className="w-5 h-5" />
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
                  w-full px-4 py-3 pl-11 pr-11 rounded-xl
                  bg-background-subtle/50 border border-border-subtle
                  text-text-primary placeholder-zinc-600
                  hover:border-border-subtle focus:border-indigo-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-soft transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Confirm password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                className={`
                  w-full px-4 py-3 pl-11 pr-11 rounded-xl
                  bg-background-subtle/50 border
                  text-text-primary placeholder-zinc-600
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  ${confirmPassword && !passwordsMatch
                    ? 'border-red-500/50 focus:border-red-500'
                    : confirmPassword && passwordsMatch
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-border-subtle hover:border-border-subtle focus:border-indigo-500'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-soft transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Passwords do not match
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
            className="
              w-full py-3 px-4 rounded-xl font-medium
              bg-gradient-to-r from-indigo-500 to-purple-600 text-white
              hover:from-indigo-600 hover:to-purple-700
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating password...
              </>
            ) : (
              'Update password'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-text-soft hover:text-text-primary text-sm transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
