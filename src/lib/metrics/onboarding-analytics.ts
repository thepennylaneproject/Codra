/**
 * Onboarding Funnel Analytics
 *
 * Tracks user progress through the onboarding flow to measure:
 * - Steps to first spread (target: 9 → 3)
 * - Time to first output (target: ~5 min → <60 sec)
 * - Drop-off rates per step
 */

import { analytics } from '../analytics';

export interface OnboardingStep {
  step: number;
  stepName: string;
  timestamp?: number;
}

export interface OnboardingSession {
  sessionId: string;
  startTime: number;
  currentStep: number;
  completedSteps: OnboardingStep[];
}

// Track onboarding session in memory
let currentSession: OnboardingSession | null = null;

/**
 * Start an onboarding session
 */
export function startOnboarding(sessionId: string = crypto.randomUUID()): void {
  currentSession = {
    sessionId,
    startTime: Date.now(),
    currentStep: 0,
    completedSteps: []
  };

  analytics.track('onboarding_started', {
    sessionId,
    timestamp: Date.now()
  });
}

/**
 * Track when a step is viewed
 */
export function trackStepViewed(step: number, stepName: string): void {
  if (!currentSession) {
    startOnboarding();
  }

  analytics.track('onboarding_step_viewed', {
    sessionId: currentSession?.sessionId,
    step,
    stepName,
    timestamp: Date.now(),
    timeFromStart: Date.now() - (currentSession?.startTime || Date.now())
  });
}

/**
 * Track when a step is completed
 */
export function trackStepCompleted(step: number, stepName: string): void {
  if (!currentSession) return;

  const stepStartTime = currentSession.completedSteps[currentSession.completedSteps.length - 1]?.timestamp
    || currentSession.startTime;
  const durationMs = Date.now() - stepStartTime;

  currentSession.completedSteps.push({
    step,
    stepName,
    timestamp: Date.now()
  });

  currentSession.currentStep = step + 1;

  analytics.track('onboarding_step_completed', {
    sessionId: currentSession.sessionId,
    step,
    stepName,
    durationMs,
    timeFromStart: Date.now() - currentSession.startTime
  });
}

/**
 * Track when the entire onboarding is completed
 */
export function trackOnboardingCompleted(): void {
  if (!currentSession) return;

  const totalDurationMs = Date.now() - currentSession.startTime;
  const totalSteps = currentSession.completedSteps.length;

  analytics.track('onboarding_completed', {
    sessionId: currentSession.sessionId,
    totalSteps,
    totalDurationMs,
    averageStepDuration: totalDurationMs / totalSteps,
    steps: currentSession.completedSteps.map(s => s.stepName)
  });

  // Keep session for first spread tracking
}

/**
 * Track when the first spread is generated
 */
export function trackFirstSpreadGenerated(projectId: string, spreadId?: string): void {
  if (!currentSession) return;

  const durationFromStart = Date.now() - currentSession.startTime;

  analytics.track('first_spread_generated', {
    sessionId: currentSession.sessionId,
    projectId,
    spreadId,
    durationFromStart,
    meetsTarget: durationFromStart < 60000, // Target: < 60 seconds
    timestamp: Date.now()
  });

  // Clear session after first spread
  currentSession = null;
}

/**
 * Track when a user abandons onboarding
 */
export function trackOnboardingAbandoned(reason?: string): void {
  if (!currentSession) return;

  const durationMs = Date.now() - currentSession.startTime;

  analytics.track('onboarding_abandoned', {
    sessionId: currentSession.sessionId,
    lastStep: currentSession.currentStep,
    lastStepName: currentSession.completedSteps[currentSession.completedSteps.length - 1]?.stepName,
    durationMs,
    reason
  });

  currentSession = null;
}

/**
 * Get current onboarding metrics (for development/debugging)
 */
export function getOnboardingMetrics(): {
  isActive: boolean;
  currentStep: number;
  duration: number;
  completedSteps: number;
} {
  if (!currentSession) {
    return {
      isActive: false,
      currentStep: 0,
      duration: 0,
      completedSteps: 0
    };
  }

  return {
    isActive: true,
    currentStep: currentSession.currentStep,
    duration: Date.now() - currentSession.startTime,
    completedSteps: currentSession.completedSteps.length
  };
}
