/**
 * WELCOME STEP
 * Choose path: Quick start, Guided setup, or Explore demo
 */

import React from 'react';
import { Zap, Compass, Play } from 'lucide-react';
import type { OnboardingState } from '../../../lib/onboarding/onboarding-store';

interface WelcomeStepProps {
    onComplete: (data?: Partial<OnboardingState>) => void;
}

const PATHS = [
    {
        id: 'guided',
        icon: Compass,
        title: 'Guided Setup',
        description: 'Step-by-step walkthrough with AI assistance',
        recommended: true,
        action: 'Start Setup',
        color: 'brand-teal',
    },
    {
        id: 'quick',
        icon: Zap,
        title: 'Quick Start',
        description: 'Jump straight in if you know what you\'re doing',
        recommended: false,
        action: 'Skip to Studio',
        color: 'brand-gold',
    },
    {
        id: 'demo',
        icon: Play,
        title: 'Try Demo Mode',
        description: 'Explore with sample projects and demo AI',
        recommended: false,
        action: 'Start Demo',
        color: 'brand-magenta',
    },
];

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onComplete }) => {
    const handlePathSelect = (pathId: string) => {
        if (pathId === 'demo') {
            onComplete({ preferences: { useDemoMode: true, hasOwnCredentials: false, wantsTour: true, emailUpdates: true } });
        } else if (pathId === 'quick') {
            // Skip most steps - we'll handle skipping logic in the wizard usually, 
            // but here we just mark preferences. The store logic handles next steps.
            // Ideally we would trigger skips, but let's just proceed to profile for now, 
            // or maybe we want complete skipping?
            // For now, let's treat "Quick Start" as just normal flow but knowing intent.
            onComplete({ preferences: { useDemoMode: false, hasOwnCredentials: false, wantsTour: false, emailUpdates: true } });
        } else {
            onComplete();
        }
    };

    return (
        <div className="space-y-6">
            <p className="text-body-md text-text-secondary text-center">
                Codra helps you build, automate, and deploy AI-powered workflows.
                <br />
                How would you like to get started?
            </p>

            <div className="grid gap-4">
                {PATHS.map((path) => {
                    const Icon = path.icon;
                    // Tailwind dynamic classes hack: border-brand-teal bg-brand-teal/5 text-brand-teal bg-brand-teal/20
                    // border-brand-gold bg-brand-gold/5 text-brand-gold bg-brand-gold/20
                    // border-brand-magenta bg-brand-magenta/5 text-brand-magenta bg-brand-magenta/20

                    return (
                        <button
                            key={path.id}
                            onClick={() => handlePathSelect(path.id)}
                            className={`relative p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${path.recommended
                                    ? `border-${path.color} bg-${path.color}/5`
                                    : 'border-border-subtle hover:border-border-strong'
                                }`}
                        >
                            {path.recommended && (
                                <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-brand-teal text-background-default text-label-sm font-semibold rounded">
                                    Recommended
                                </span>
                            )}

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg bg-${path.color}/20`}>
                                    <Icon className={`w-6 h-6 text-${path.color}`} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-label-lg text-text-primary font-semibold mb-1">
                                        {path.title}
                                    </h3>
                                    <p className="text-body-sm text-text-muted mb-3">
                                        {path.description}
                                    </p>
                                    <span className={`text-label-sm text-${path.color} font-medium`}>
                                        {path.action} →
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-body-sm text-text-soft text-center">
                You can always change these settings later in your profile.
            </p>
        </div>
    );
};
