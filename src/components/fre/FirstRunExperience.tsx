/**
 * FIRST-RUN EXPERIENCE (FRE) COMPONENT
 * Guided onboarding tour using Shepherd.js
 * Walks new users through project creation → workspace → task execution
 */

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './fre.css';
import { useAuth } from '@/lib/auth/AuthProvider';
import { analytics } from '@/lib/analytics';

export interface FirstRunExperienceProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// Tour step configuration
const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Codra! 🎨',
    text: `
      <p>Let's create your first creative project together.</p>
      <p class="fre-subtext">This quick tour will show you how to generate amazing content in under 2 minutes.</p>
    `,
    attachTo: undefined, // Centered modal
  },
  {
    id: 'create-button',
    title: 'Create a Project',
    text: 'Click the <strong>Create</strong> button to start your first project.',
    attachTo: { element: '[data-tour="create-button"]', on: 'bottom' as const },
  },
  {
    id: 'project-type',
    title: 'Choose Your Project Type',
    text: 'Select the type that best describes what you\'re building. This helps Lyra generate better suggestions.',
    attachTo: { element: '[data-tour="project-type"]', on: 'right' as const },
  },
  {
    id: 'project-name',
    title: 'Name Your Project',
    text: 'Give your project a name and brief description. Don\'t worry—you can change this later.',
    attachTo: { element: '[data-tour="project-name"]', on: 'bottom' as const },
  },
  {
    id: 'workspace-intro',
    title: 'Meet Lyra, Your AI Assistant',
    text: `
      <p>This is your workspace. <strong>Lyra</strong> is your AI creative partner.</p>
      <p class="fre-subtext">She'll help you write copy, design assets, and bring your ideas to life.</p>
    `,
    attachTo: { element: '[data-tour="lyra-assistant"]', on: 'left' as const },
  },
  {
    id: 'task-queue',
    title: 'Your Task Queue',
    text: 'Here are your creative tasks. Each one generates a specific piece of content for your project.',
    attachTo: { element: '[data-tour="task-queue"]', on: 'right' as const },
  },
  {
    id: 'run-task',
    title: 'Run Your First Task',
    text: 'Click <strong>Run</strong> to generate your first piece of content. Watch the magic happen!',
    attachTo: { element: '[data-tour="run-button"]', on: 'left' as const },
  },
  {
    id: 'congratulations',
    title: 'Congratulations! 🎉',
    text: `
      <p>You've created your first output!</p>
      <p class="fre-subtext"><strong>Next steps:</strong> Explore more tasks, refine your brand, or export your work.</p>
    `,
    attachTo: undefined, // Centered modal
  },
];

export function FirstRunExperience({ onComplete, onSkip }: FirstRunExperienceProps) {
  const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const currentStepRef = useRef<number>(0);
  const { completeOnboarding } = useAuth();

  useEffect(() => {
    // Store callback refs at effect time
    const onCompleteRef = onComplete;
    const onSkipRef = onSkip;
    const completeOnboardingRef = completeOnboarding;

    // Initialize Shepherd tour
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'fre-shepherd-step',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: false, // We use our own skip button
        },
      },
    });

    const handleTourComplete = async () => {
      const duration = Date.now() - startTimeRef.current;
      
      // Track completion
      analytics.track('fre_completed', {
        totalSteps: TOUR_STEPS.length,
        totalDurationMs: duration,
      });

      // Mark onboarding as complete in database
      await completeOnboardingRef();
      
      onCompleteRef();
    };

    const handleTourSkip = () => {
      const currentStep = tour.getCurrentStep();
      
      // Track skip event
      analytics.track('fre_skipped', {
        stepsCompleted: currentStepRef.current,
        lastStepId: currentStep?.id || 'unknown',
      });

      // Don't mark onboarding complete - let user see FRE again
      onSkipRef?.();
      onCompleteRef();
    };

    // Add all steps
    TOUR_STEPS.forEach((step, index) => {
      const isLastStep = index === TOUR_STEPS.length - 1;

      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        buttons: [
          // Skip button (not on last step)
          ...(!isLastStep ? [{
            text: 'Skip Tour',
            classes: 'fre-btn-skip',
            action: () => {
              tour.cancel();
            },
          }] : []),
          // Next/Finish button
          {
            text: isLastStep ? 'Get Started' : 'Next →',
            classes: 'fre-btn-primary',
            action: isLastStep 
              ? () => {
                  tour.complete();
                }
              : () => tour.next(),
          },
        ],
        when: {
          show: () => {
            currentStepRef.current = index;
            analytics.track('fre_step_viewed', {
              step: index + 1,
              stepId: step.id,
              stepTitle: step.title.replace(/<[^>]*>/g, ''), // Strip HTML
            });
          },
        },
      });
    });

    // Event handlers
    tour.on('complete', handleTourComplete);
    tour.on('cancel', handleTourSkip);

    tourRef.current = tour;

    // Track FRE start and begin tour
    analytics.track('fre_started');
    tour.start();

    // Cleanup
    return () => {
      if (tourRef.current) {
        // Remove event listeners before canceling to prevent callbacks
        tourRef.current.off('complete', handleTourComplete);
        tourRef.current.off('cancel', handleTourSkip);
        tourRef.current.cancel();
        tourRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // This component doesn't render anything - Shepherd handles the UI
  return null;
}

export default FirstRunExperience;
