import React from 'react';

interface IntakeProgressProps {
    steps: Array<{ id: string; label: string }>;
    currentStep: number;
}

export const IntakeProgress: React.FC<IntakeProgressProps> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between">
            {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isLast = index === steps.length - 1;

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                            {/* Circle */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-label-sm font-semibold transition-all ${isActive
                                        ? 'bg-brand-teal text-background-default ring-4 ring-brand-teal/20'
                                        : isCompleted
                                            ? 'bg-brand-teal text-background-default'
                                            : 'bg-background-subtle border-2 border-border-subtle text-text-muted'
                                    }`}
                            >
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            {/* Label */}
                            <span
                                className={`mt-2 text-label-xs ${isActive ? 'text-text-primary font-semibold' : 'text-text-muted'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {!isLast && (
                            <div className="flex-1 h-0.5 mx-2 -mt-8">
                                <div
                                    className={`h-full transition-all ${isCompleted ? 'bg-brand-teal' : 'bg-border-subtle'
                                        }`}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
