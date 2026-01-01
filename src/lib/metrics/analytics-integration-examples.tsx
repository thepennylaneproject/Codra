/**
 * Analytics Integration Examples for Onboarding Flow
 *
 * This file demonstrates how to integrate the metrics analytics
 * into the Codra onboarding flow. Copy these patterns into your
 * actual components.
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  startOnboarding,
  trackStepViewed,
  trackStepCompleted,
  trackOnboardingCompleted,
  trackFirstSpreadGenerated,
  trackOnboardingAbandoned
} from '../../../lib/metrics/onboarding-analytics';

/**
 * EXAMPLE 1: OnboardingFlow.tsx
 *
 * Track when onboarding starts and when steps are viewed
 */
export const OnboardingFlowWithAnalytics = () => {
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get('step') || 'project-info';

  // Start tracking when component mounts
  useEffect(() => {
    startOnboarding();
  }, []);

  // Track step views
  useEffect(() => {
    const stepNumber = stepParam === 'context' ? 2 : stepParam === 'generating' ? 3 : 1;
    trackStepViewed(stepNumber, stepParam);
  }, [stepParam]);

  // Track abandonment when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackOnboardingAbandoned('User navigated away');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ... rest of component
  return null;
};

/**
 * EXAMPLE 2: StepProjectInfo.tsx
 *
 * Track when user completes the project info step
 */
export const StepProjectInfoWithAnalytics = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    // Track completion before navigating
    trackStepCompleted(1, 'project-info');
    navigate('/new?step=context');
  };

  // ... rest of component
  return null;
};

/**
 * EXAMPLE 3: StepAddContext.tsx
 *
 * Track optional context step
 */
export const StepAddContextWithAnalytics = () => {
  const navigate = useNavigate();

  const handleSkip = () => {
    trackStepCompleted(2, 'add-context');
    navigate('/new?step=generating');
  };

  const handleContinue = () => {
    trackStepCompleted(2, 'add-context');
    navigate('/new?step=generating');
  };

  // ... rest of component
  return null;
};

/**
 * EXAMPLE 4: StepGenerating.tsx
 *
 * Track when generation completes and onboarding is done
 */
export const StepGeneratingWithAnalytics = () => {
  const navigate = useNavigate();

  const handleGenerationComplete = (projectId: string, spreadId: string) => {
    // Track step completion
    trackStepCompleted(3, 'generating');

    // Track onboarding completion
    trackOnboardingCompleted();

    // Track first spread generation
    trackFirstSpreadGenerated(projectId, spreadId);

    // Navigate to the project
    navigate(`/p/${projectId}/production`);
  };

  // ... rest of component
  return null;
};

/**
 * EXAMPLE 5: Integration in useSpreadGeneration hook
 *
 * Track spread generation from the generation hook
 */
export const useSpreadGenerationWithAnalytics = () => {
  const generateSpread = async (projectData: any) => {
    try {
      // ... existing generation logic
      const result = await createSpread(projectData);

      // Track first spread generation
      trackFirstSpreadGenerated(result.projectId, result.spreadId);

      return result;
    } catch (error) {
      // Track failure if needed
      console.error('Spread generation failed:', error);
      throw error;
    }
  };

  return { generateSpread };
};

/**
 * INTEGRATION CHECKLIST:
 *
 * ✅ 1. Import analytics functions in OnboardingFlow.tsx
 * ✅ 2. Call startOnboarding() when flow begins
 * ✅ 3. Call trackStepViewed() for each step
 * ✅ 4. Call trackStepCompleted() when user proceeds from a step
 * ✅ 5. Call trackOnboardingCompleted() when all steps are done
 * ✅ 6. Call trackFirstSpreadGenerated() when spread is created
 * ✅ 7. Call trackOnboardingAbandoned() if user leaves early
 *
 * IMPORTANT: These analytics calls are non-blocking and won't affect
 * the user experience. They send events to PostHog for analysis.
 */
