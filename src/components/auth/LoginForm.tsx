import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import type { OAuthProvider } from '../../lib/api/auth.types';
import { Input, Heading, Text } from '../../new/components';

// ============================================================
// Icons
// ============================================================

import { AuthIcons as Icons } from './AuthIcons';
import { Button } from '@/components/ui/Button';

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
    google: {
      icon: <Icons.Google />,
      label: 'Google',
    },
    github: {
      icon: <Icons.Github />,
      label: 'GitHub',
    },
    discord: {
      icon: <Icons.Discord />,
      label: 'Discord',
    },
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
// Login Form Component
// ============================================================

export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithOAuth, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get return URL
  const returnTo = searchParams.get('returnTo') || '/';

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { success, error: loginError } = await login({ email, password });

      if (!success && loginError) {
        setError(loginError);
        return;
      }

      // Navigate to return URL on success
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError('Unexpected error. Retry.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, navigate, returnTo]);

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async (provider: OAuthProvider) => {
    setError(null);
    try {
      await loginWithOAuth(provider);
    } catch (err) {
      setError('OAuth login failed. Retry.');
    }
  }, [loginWithOAuth]);

  const formDisabled = isLoading || isSubmitting;

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
            Workflow orchestration platform
          </Heading>
          <Text size="base" className="text-white/60 font-medium italic">
            Orchestrate asset, content, and code pipelines with configured models and project context.
          </Text>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-4">
          {[
            'Multi-provider AI with smart routing',
            'Specialized desks for every discipline',
            'Budget guardrails and cost tracking',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-white/60">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <Text size="sm">{feature}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
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
            <Heading size="xl" className="text-brand-ink mb-2">Sign-in</Heading>
            <Text variant="muted">Sign in to continue</Text>
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Icons.Lock size={18} />}
              disabled={formDisabled}
              autoComplete="current-password"
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

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-zinc-500 hover:text-brand-ink transition-colors font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={formDisabled || !email || !password}
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <Text variant="muted">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="text-zinc-500 hover:text-brand-ink font-semibold transition-colors"
              >
                Create account
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
