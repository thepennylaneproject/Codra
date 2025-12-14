/**
 * SUCCESS STEP
 * Celebration and next steps
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, BookOpen, Zap, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { OnboardingState } from '../../../lib/onboarding/onboarding-store';

interface SuccessStepProps {
    state: OnboardingState;
    onComplete: () => void;
}

const NEXT_STEPS = [
    {
        icon: Zap,
        title: 'Create a Project',
        description: 'Start building with AI assistance',
        href: '/studio',
    },
    {
        icon: BookOpen,
        title: 'Read the Docs',
        description: 'Learn about all features',
        href: '/docs',
    },
    {
        icon: Users,
        title: 'Join Community',
        description: 'Connect with other makers',
        href: 'https://discord.gg/codra',
        external: true,
    },
];

export const SuccessStep: React.FC<SuccessStepProps> = ({ state, onComplete }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Fire confetti on mount
        if (!showConfetti) {
            setShowConfetti(true);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D81159', '#F4D03F', '#00D9D9'],
            });
        }
    }, [showConfetti]);

    const completionTime = state.startedAt && state.completedAt
        ? Math.round((new Date(state.completedAt).getTime() - new Date(state.startedAt).getTime()) / 1000)
        : null;

    return (
        <div className="text-center space-y-8">
            {/* Success Message */}
            <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-forge animate-pulse">
                    <Sparkles className="w-10 h-10 text-background-default" />
                </div>

                <h2 className="text-heading-lg text-text-primary font-bold">
                    Welcome to Codra, {state.profile.displayName || 'Creator'}!
                </h2>

                <p className="text-body-lg text-text-muted">
                    You're all set up and ready to build.
                    {completionTime && completionTime < 300 && (
                        <span className="block text-brand-teal mt-1">
                            ⚡ Completed in {Math.floor(completionTime / 60)}m {completionTime % 60}s
                        </span>
                    )}
                </p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 py-6 border-y border-border-subtle">
                <div className="text-center">
                    <span className="text-heading-md text-brand-teal font-bold block">
                        {state.preferences.useDemoMode ? 'Demo' : 'Connected'}
                    </span>
                    <span className="text-body-sm text-text-muted">AI Mode</span>
                </div>
                <div className="text-center">
                    <span className="text-heading-md text-brand-gold font-bold block">
                        {state.firstProjectId ? '1' : '0'}
                    </span>
                    <span className="text-body-sm text-text-muted">Projects</span>
                </div>
                <div className="text-center">
                    <span className="text-heading-md text-brand-magenta font-bold block">
                        Ready
                    </span>
                    <span className="text-body-sm text-text-muted">Status</span>
                </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-3">
                <h3 className="text-label-md text-text-muted uppercase tracking-wide">
                    Next Steps
                </h3>
                <div className="grid gap-3">
                    {NEXT_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isExternal = 'external' in step && step.external;

                        return (
                            <a
                                key={index}
                                href={step.href}
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                className="flex items-center gap-4 p-4 rounded-lg border border-border-subtle hover:border-border-strong hover:bg-background-subtle transition-colors text-left"
                            >
                                <Icon className="w-5 h-5 text-brand-teal" />
                                <div className="flex-1">
                                    <span className="text-label-md text-text-primary font-medium block">
                                        {step.title}
                                    </span>
                                    <span className="text-body-sm text-text-muted">{step.description}</span>
                                </div>
                                <span className="text-text-muted">→</span>
                            </a>
                        );
                    })}
                </div>
            </div>

            {/* Go to Dashboard */}
            <button
                onClick={onComplete}
                className="px-8 py-4 bg-gradient-forge rounded-full text-label-md font-bold text-background-default hover:shadow-2xl hover:scale-105 transition-all glow-magenta"
            >
                Go to Dashboard →
            </button>
        </div>
    );
};
