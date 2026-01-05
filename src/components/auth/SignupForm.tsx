import { useState, useCallback, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import type { OAuthProvider } from '../../lib/api/auth.types';
import { Input, Heading, Text, Label } from '../../new/components';

// ============================================================
// Icons
// ============================================================

import { AuthIcons as Icons } from './AuthIcons';
import { Button } from '@/components/ui/Button';

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
        <div className="flex-1 h-1.5 bg-[var(--ui-border)] rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                level <= strength.level ? strength.color : 'bg-[var(--ui-border)]'
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
              req.met ? 'text-emerald-600' : 'text-text-soft'
            }`}
          >
            {req.met ? <Icons.Check size={14} /> : <Icons.X size={14} />}
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
    github: { icon: <Icons.Github />, label: 'GitHub' },
    discord: { icon: <Icons.Discord />, label: 'Discord' },
  };

  const { icon, label } = config[provider as keyof typeof config];

  return (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className="flex-1"
      size="md"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </Button>
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
        <Icons.CheckCircle size={32} />
      </div>

      <Heading size="xl" className="text-brand-ink mb-2">Check your email</Heading>
      <Text variant="muted" className="mb-6">
        We&apos;ve sent a confirmation link to <span className="text-brand-ink font-semibold">{email}</span>
      </Text>

      <div className="p-4 rounded-xl bg-white border border-[var(--ui-border)] text-left">
        <Text size="sm" variant="muted">
          Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
        </Text>
      </div>

      <Link
        to="/login"
        className="mt-6 inline-block text-zinc-500 hover:text-brand-ink text-sm font-semibold transition-colors"
      >
        Open login
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
      setError('Terms acceptance required.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet strength requirements.');
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
      setError('Unexpected error. Retry.');
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
      setError('OAuth signup failed. Retry.');
    }
  }, [loginWithOAuth]);

  const formDisabled = isLoading || isSubmitting;

  // Show success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center p-6 text-text-primary">
        <div className="w-full max-w-md">
          <SignupSuccess email={email} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] flex text-text-primary">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--brand-ink)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>
        {/* Accent Gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-300/40 blur-[120px] rounded-full -mr-12 -mt-12" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-600 flex items-center justify-center text-white shadow-lg shadow-zinc-500/30">
            <Icons.Activity size={20} />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">Codra</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-md">
          <Heading size="xl" className="text-white mb-4" as="h1">
            AI-assisted creation
          </Heading>
          <Text size="base" className="text-white/60 font-medium italic">
            Design visuals, write content, and build code with AI that understands your project.
          </Text>
        </div>

        {/* What's included */}
        <div className="relative z-10 space-y-4">
          <Label variant="muted" className="text-white/40">What&apos;s included</Label>
          {[
            'Free tier with 1,000 AI requests/month',
            'Specialized desks for every discipline',
            'Budget guardrails and cost tracking',
            'Editorial-grade project context',
            'Community blueprints',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-white/60">
              <div className="w-5 h-5 rounded-full bg-zinc-300/40 flex items-center justify-center text-zinc-500">
                <Icons.Check size={12} />
              </div>
              <Text size="sm">{feature}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-zinc-600 flex items-center justify-center text-white shadow-lg shadow-zinc-500/30">
              <Icons.Activity size={20} />
            </div>
            <span className="text-xl font-semibold text-brand-ink tracking-tight">Codra</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <Heading size="xl" className="text-brand-ink mb-2">Account creation</Heading>
            <Text variant="muted">Start building with AI in minutes</Text>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <Icons.AlertCircle className="text-red-500 mt-0" size={18} />
              <Text size="sm" className="text-red-600">{error}</Text>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="flex gap-3 mb-6">
            <OAuthButton provider="google" onClick={() => handleOAuthLogin('google')} disabled={formDisabled} />
            <OAuthButton provider="github" onClick={() => handleOAuthLogin('github')} disabled={formDisabled} />
            <OAuthButton provider="discord" onClick={() => handleOAuthLogin('discord')} disabled={formDisabled} />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--ui-border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-sm text-text-soft bg-[var(--ui-bg)] font-medium">or continue with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              icon={<Icons.User size={18} />}
              disabled={formDisabled}
              autoComplete="name"
              optional
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Icons.Mail size={18} />}
              disabled={formDisabled}
              autoComplete="email"
              required
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                icon={<Icons.Lock size={18} />}
                disabled={formDisabled}
                autoComplete="new-password"
                required
                rightElement={
                  <Button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-soft hover:text-text-primary transition-colors p-1"
                  >
                    {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </Button>
                }
              />
              <PasswordStrength password={password} />
            </div>

            <Input
              label="Company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              icon={<Icons.Building size={18} />}
              disabled={formDisabled}
              autoComplete="organization"
              optional
            />

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group pt-2">
              <div className="relative flex-shrink-0 mt-0">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border border-[var(--ui-border)] bg-white peer-checked:bg-zinc-600 peer-checked:border-zinc-400 transition-all flex items-center justify-center text-white">
                  {agreedToTerms && <Icons.Check size={14} />}
                </div>
              </div>
              <Text size="sm" variant="muted" className="group-hover:text-brand-ink transition-colors leading-normal">
                I agree to the{' '}
                <a href="/terms" className="text-zinc-500 hover:text-brand-ink font-semibold transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-zinc-500 hover:text-brand-ink font-semibold transition-colors">Privacy Policy</a>
              </Text>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={formDisabled || !email || !password || !agreedToTerms}
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Create account
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <Text variant="muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-zinc-500 hover:text-brand-ink font-semibold transition-colors"
              >
                Sign in
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
