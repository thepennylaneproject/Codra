import { STEP_ORDER, IMPORT_STEP_ORDER, STEP_METADATA, OnboardingStep, getStepProgress, useOnboardingStore } from '../store';
import { Check } from 'lucide-react';

interface OnboardingProgressProps {
    currentStep: OnboardingStep;
}

export const OnboardingProgress = ({ currentStep }: OnboardingProgressProps) => {
    const { profile } = useOnboardingStore();
    const isImportFlow = profile.isImportFlow;

    const stepOrder = isImportFlow ? IMPORT_STEP_ORDER : STEP_ORDER;
    const currentIndex = stepOrder.indexOf(currentStep);
    const progress = getStepProgress(currentStep, isImportFlow);

    // Only show meaningful steps (exclude mode, generating, complete)
    const displaySteps = stepOrder.filter(s =>
        !['mode', 'generating', 'complete'].includes(s)
    );

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="relative h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 bg-zinc-900 dark:bg-zinc-100 transition-all duration-500 ease-out animate-shimmer"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Step Labels */}
            <div className="flex justify-between items-center">
                {displaySteps.map((step, index) => {
                    const stepIndex = stepOrder.indexOf(step);
                    const isComplete = currentIndex > stepIndex;
                    const isCurrent = step === currentStep;
                    const meta = STEP_METADATA[step];

                    return (
                        <div
                            key={step}
                            className={`flex items-center gap-2 transition-all duration-300 ${isCurrent
                                ? 'text-zinc-900 dark:text-zinc-100'
                                : isComplete
                                    ? 'text-zinc-500'
                                    : 'text-zinc-300 dark:text-zinc-700'
                                }`}
                        >
                            {/* Step Indicator */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${isComplete
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : isCurrent
                                    ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100 ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950'
                                    : 'bg-zinc-100 dark:bg-zinc-800'
                                }`}>
                                {isComplete ? <Check size={12} strokeWidth={1.5} /> : index + 1}
                            </div>

                            {/* Label (hidden on mobile except for current) */}
                            <span className={`text-xs font-medium uppercase tracking-wider hidden sm:block ${isCurrent ? '' : 'opacity-60'
                                }`}>
                                {meta.progressLabel}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
