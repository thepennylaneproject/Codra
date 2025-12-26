// ============================================================
// CODRA SIGNUP FORM
// src/components/auth/SignupForm.tsx
// Light mode, editorial ivory/coral aesthetic matching app theme
// ============================================================

import { useState, useCallback, useMemo, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import type { OAuthProvider } from '../../lib/api/auth.types';

// ============================================================
// Icons (same as LoginForm for consistency)
// ============================================================

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
  Mail: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  GitHub: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  Discord: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
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
  Activity: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ============================================================
// Form Input Component
// ============================================================

interface FormInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  rightElement?: ReactNode;
  optional?: boolean;
}

function FormInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  error,
  disabled,
  autoComplete,
  rightElement,
  optional,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]">
        {label}
        {optional && <span className="text-[#8A8A8A] font-normal">(optional)</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white border transition-all duration-200
            text-[#1A1A1A] placeholder-[#8A8A8A]
            focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/30
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-11' : ''}
            ${rightElement ? 'pr-11' : ''}
            ${error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 focus:border-[#FF4D4D]'
            }
          `}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <Icons.AlertCircle />
          {error}
        </p>
      )}
    </div>
  );
}

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
      {/* Strength Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                level <= strength.level ? strength.color : 'bg-[#1A1A1A]/10'
              }`}
            />
          ))}
        </div>
        {strength.label && (
          <span className={`text-xs font-medium ${
            strength.level >= 3 ? 'text-emerald-600' :
            strength.level >= 2 ? 'text-yellow-600' : 'text-red-500'
          }`}>
            {strength.label}
          </span>
        )}
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-2 gap-2">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 text-xs transition-colors ${
              req.met ? 'text-emerald-600' : 'text-[#8A8A8A]'
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
// OAuth Button Component
// ============================================================

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  disabled?: boolean;
}

function OAuthButton({ provider, onClick, disabled }: OAuthButtonProps) {
  const config = {
    google: { icon: <Icons.Google />, label: 'Google' },
    github: { icon: <Icons.GitHub />, label: 'GitHub' },
    discord: { icon: <Icons.Discord />, label: 'Discord' },
  };

  const { icon, label } = config[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center justify-center gap-2 px-4 py-3 rounded-xl
        bg-white border border-[#1A1A1A]/10 text-[#5A5A5A]
        hover:bg-[#1A1A1A]/5 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// ============================================================
// Success State
// ============================================================

interface SignupSuccessProps {
  email: string;
}

function SignupSuccess({ email }: SignupSuccessProps) {
  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
        <Icons.CheckCircle />
      </div>

      <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Check your email</h2>
      <p className="text-[#5A5A5A] mb-6">
        We've sent a confirmation link to <span className="text-[#1A1A1A] font-medium">{email}</span>
      </p>

      <div className="p-4 rounded-xl bg-white border border-[#1A1A1A]/10 text-left">
        <p className="text-sm text-[#5A5A5A]">
          Click the link in the email to verify your account. If you don't see it, check your spam folder.
        </p>
      </div>

      <Link
        to="/login"
        className="mt-6 inline-block text-[#FF4D4D] hover:text-[#1A1A1A] text-sm font-bold transition-colors"
      >
        Back to login
      </Link>
    </div>
  );
}

// ============================================================
// Signup Form Component
// ============================================================

export function SignupForm() {
  const { signup, loginWithOAuth, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Password validation
  const isPasswordValid = useMemo(() => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  }, [password]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('Please agree to the terms of service and privacy policy.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please choose a stronger password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { success, error: signupError } = await signup({
        email,
        password,
        metadata: {
          fullName: fullName || undefined,
          company: company || undefined,
        },
      });

      if (!success && signupError) {
        setError(signupError);
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, fullName, company, agreedToTerms, isPasswordValid, signup]);

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async (provider: OAuthProvider) => {
    setError(null);
    try {
      await loginWithOAuth(provider);
    } catch (err) {
      setError('OAuth signup failed. Please try again.');
    }
  }, [loginWithOAuth]);

  const formDisabled = isLoading || isSubmitting;

  // Show success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <SignupSuccess email={email} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A1A] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }} />
        </div>
        {/* Accent Gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4D4D]/20 blur-[120px] rounded-full -mr-48 -mt-48" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4D4D] flex items-center justify-center text-white shadow-lg shadow-[#FF4D4D]/30">
            <Icons.Activity />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Codra</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">
            Create with AI specialists
          </h1>
          <p className="text-lg text-white/60 font-medium italic">
            Design visuals, write content, and build code with AI that understands your project.
          </p>
        </div>

        {/* What's included */}
        <div className="relative z-10 space-y-4">
          <p className="text-sm font-black text-white/40 uppercase tracking-widest">What's included</p>
          {[
            'Free tier with 1,000 AI requests/month',
            'Specialized desks for every discipline',
            'Budget guardrails and cost tracking',
            'Editorial-grade project context',
            'Community blueprints',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-white/60">
              <div className="w-5 h-5 rounded-full bg-[#FF4D4D]/20 flex items-center justify-center text-[#FF4D4D]">
                <Icons.Check />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D4D] flex items-center justify-center text-white shadow-lg shadow-[#FF4D4D]/30">
              <Icons.Activity />
            </div>
            <span className="text-2xl font-black text-[#1A1A1A] tracking-tight">Codra</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Create your account</h2>
            <p className="text-[#5A5A5A]">Start building with AI in minutes</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <Icons.AlertCircle />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <OAuthButton provider="google" onClick={() => handleOAuthLogin('google')} disabled={formDisabled} />
            <OAuthButton provider="github" onClick={() => handleOAuthLogin('github')} disabled={formDisabled} />
            <OAuthButton provider="discord" onClick={() => handleOAuthLogin('discord')} disabled={formDisabled} />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1A1A1A]/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-[#8A8A8A] bg-[#FFFAF0]">or continue with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="Full name"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="John Doe"
              icon={<Icons.User />}
              disabled={formDisabled}
              autoComplete="name"
              optional
            />

            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon={<Icons.Mail />}
              disabled={formDisabled}
              autoComplete="email"
            />

            <div className="space-y-2">
              <FormInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Choose a strong password"
                icon={<Icons.Lock />}
                disabled={formDisabled}
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </div>

            <FormInput
              label="Company"
              type="text"
              value={company}
              onChange={setCompany}
              placeholder="Your company name"
              icon={<Icons.Building />}
              disabled={formDisabled}
              autoComplete="organization"
              optional
            />

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border border-[#1A1A1A]/20 bg-white peer-checked:bg-[#FF4D4D] peer-checked:border-[#FF4D4D] transition-all flex items-center justify-center text-white">
                  {agreedToTerms && <Icons.Check />}
                </div>
              </div>
              <span className="text-sm text-[#5A5A5A] group-hover:text-[#1A1A1A] transition-colors">
                I agree to the{' '}
                <a href="/terms" className="text-[#FF4D4D] hover:text-[#1A1A1A] font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-[#FF4D4D] hover:text-[#1A1A1A] font-medium">Privacy Policy</a>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formDisabled || !email || !password || !agreedToTerms}
              className="
                w-full py-4 px-4 rounded-xl font-black uppercase tracking-widest text-xs
                bg-[#1A1A1A] text-white
                hover:bg-[#FF4D4D]
                focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/50
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-xl shadow-[#1A1A1A]/10
                flex items-center justify-center gap-2
              "
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-[#5A5A5A]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#FF4D4D] hover:text-[#1A1A1A] font-bold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
