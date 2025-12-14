/**
 * ONBOARDING TOUR
 * Simple overlay tour to guide users through the UI
 */

import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Layout, Zap, Terminal } from 'lucide-react';

interface OnboardingTourProps {
    onComplete: () => void;
    onSkip: () => void;
}

interface TourStep {
    title: string;
    description: string;
    icon: React.ElementType;
    position: 'center' | 'left' | 'right' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
    {
        title: 'Welcome to the Studio',
        description: 'This is your main workspace. Use the sidebar on the left to navigate between Projects, Prompts, and Settings.',
        icon: Layout,
        position: 'left',
    },
    {
        title: 'AI Forge',
        description: 'The AI panel on the right is your creative engine. Chat with models, generate code, and iterate on designs.',
        icon: Zap,
        position: 'right',
    },
    {
        title: 'Command Center',
        description: 'Use the Command Palette (Cmd+K) to quickly jump anywhere or execute actions without leaving your keyboard.',
        icon: Terminal,
        position: 'center',
    },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const handleNext = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const step = TOUR_STEPS[currentStepIndex];
    const Icon = step.icon;

    // Position classes (simplified for this overlay approach)
    // In a robust implementation, we'd use absolute references to DOM rects
    const positionClasses = {
        center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        left: 'top-1/3 left-20',
        right: 'top-1/3 right-20',
        bottom: 'bottom-20 left-1/2 -translate-x-1/2',
    };

    return (
        <div className="fixed inset-0 z-50 flex pointer-events-none">
            {/* Backdrop with "spotlight" hole logic is complex without libs, 
          so we use a semi-transparent slightly dark overlay for focus */}
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onSkip} />

            {/* Tour Card */}
            <div
                className={`
          absolute w-80 bg-background-elevated border border-border-subtle rounded-xl shadow-2xl p-6 pointer-events-auto transition-all duration-300
          ${positionClasses[step.position]}
        `}
            >
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-teal/20 rounded-lg text-brand-teal">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-label-sm text-text-muted font-medium">
                        {currentStepIndex + 1} of {TOUR_STEPS.length}
                    </span>
                </div>

                <h3 className="text-heading-sm text-text-primary font-bold mb-2">
                    {step.title}
                </h3>
                <p className="text-body-sm text-text-secondary mb-6 leading-relaxed">
                    {step.description}
                </p>

                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStepIndex === 0}
                        className="text-text-muted hover:text-text-primary disabled:opacity-0 transition-all text-sm font-medium flex items-center gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-brand-teal text-background-default px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-1"
                    >
                        {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        {currentStepIndex !== TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
