/**
 * ONBOARDING PROGRESS
 * Visual indicator of progress through onboarding steps
 */

import React from 'react';
import { Check } from 'lucide-react';
import { OnboardingStep, STEP_CONFIG } from '../../lib/onboarding/onboarding-store';

interface OnboardingProgressProps {
    steps: OnboardingStep[];
    currentStep: OnboardingStep;
    completedSteps: OnboardingStep[];
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
    steps,
    currentStep,
    completedSteps
}) => {
    return (
        <div className="flex items-center gap-2">
            {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step);
                const isCurrent = step === currentStep;
                const config = STEP_CONFIG[step];

                return (
                    <div key={step} className="flex items-center">
                        {/* Step Dot */}
                        <div
                            className={`
                w-8 h-8 rounded-full flex items-center justify-center text-label-xs font-bold transition-all
                ${isCompleted
                                    ? 'bg-brand-teal text-background-default'
                                    : isCurrent
                                        ? 'bg-brand-teal/20 text-brand-teal ring-2 ring-brand-teal ring-offset-2 ring-offset-background-default'
                                        : 'bg-background-subtle text-text-soft'
                                }
              `}
                            title={config.title}
                        >
                            {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>

                        {/* Connector Line (except last) */}
                        {index < steps.length - 1 && (
                            <div
                                className={`
                  w-8 h-0.5 mx-2 rounded-full transition-colors
                  ${isCompleted
                                        ? 'bg-brand-teal'
                                        : 'bg-border-subtle'
                                    }
                `}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
