/**
 * BRIEFING TOUR
 * Guided context tour with 3 anchors - not a tooltip parade
 * 
 * Anchor 1: Project Spine (tabs)
 * Anchor 2: Current Work Surface (most recent activity)
 * Anchor 3: Entry Point (one concrete action)
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Layout, Activity, Zap } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import type { NextAction } from '../../lib/briefing';

interface TourAnchor {
    id: 'spine' | 'activity' | 'entry';
    title: string;
    microcopy: string;
    icon: React.ElementType;
    highlightSelector?: string;
    position: 'center' | 'top-left' | 'top-right' | 'bottom';
}

interface BriefingTourProps {
    mostActiveTab: 'overview' | 'tasks' | 'prompts' | 'flows' | 'assets';
    suggestedAction?: NextAction;
    onComplete: () => void;
    onSkip: () => void;
}

const getTourAnchors = (
    mostActiveTab: string,
    suggestedAction?: NextAction
): TourAnchor[] => [
        {
            id: 'spine',
            title: 'The Project Spine',
            microcopy: "Everything in this project hangs off these sections. You won't break anything by exploring.",
            icon: Layout,
            highlightSelector: '[data-tour="project-tabs"]',
            position: 'top-left',
        },
        {
            id: 'activity',
            title: 'Current Work Surface',
            microcopy: `This is where work is happening right now. The ${mostActiveTab} section has the most recent activity.`,
            icon: Activity,
            highlightSelector: `[data-tour="tab-${mostActiveTab}"]`,
            position: 'top-left',
        },
        {
            id: 'entry',
            title: 'Your Entry Point',
            microcopy: suggestedAction
                ? `If you do one thing, start here: ${suggestedAction.description}`
                : "Explore the Overview tab to get a sense of what's happening.",
            icon: Zap,
            highlightSelector: '[data-tour="next-steps"]',
            position: 'bottom',
        },
    ];

export const BriefingTour: React.FC<BriefingTourProps> = ({
    mostActiveTab,
    suggestedAction,
    onComplete,
    onSkip,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const anchors = getTourAnchors(mostActiveTab, suggestedAction);
    const anchor = anchors[currentStep];

    // Highlight effect
    useEffect(() => {
        if (anchor.highlightSelector) {
            const element = document.querySelector(anchor.highlightSelector);
            if (element) {
                element.classList.add('briefing-highlight');
                return () => element.classList.remove('briefing-highlight');
            }
        }
    }, [anchor.highlightSelector]);

    const handleNext = () => {
        if (currentStep < anchors.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Position styles
    const positionStyles: Record<string, string> = {
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'top-left': 'top-32 left-8',
        'top-right': 'top-32 right-8',
        'bottom': 'bottom-8 left-1/2 -translate-x-1/2',
    };

    const Icon = anchor.icon;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Semi-transparent backdrop */}
            <div
                className="absolute inset-0 bg-black/30 pointer-events-auto"
                onClick={onSkip}
            />

            {/* Tour Card */}
            <GlassPanel
                variant="floating"
                glow="teal"
                className={`
                    absolute w-80 pointer-events-auto
                    animate-in fade-in slide-in-from-bottom-4 duration-300
                    ${positionStyles[anchor.position]}
                `}
            >
                <div className="p-5">
                    {/* Close */}
                    <button
                        onClick={onSkip}
                        className="absolute top-3 right-3 p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-energy-teal/20 rounded-lg">
                            <Icon className="w-4 h-4 text-energy-teal" />
                        </div>
                        <span className="text-label-sm text-text-muted font-medium">
                            {currentStep + 1} of {anchors.length}
                        </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-heading-sm text-text-primary font-semibold mb-2">
                        {anchor.title}
                    </h3>
                    <p className="text-body-sm text-text-secondary leading-relaxed mb-5">
                        {anchor.microcopy}
                    </p>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="flex items-center gap-1 text-body-sm text-text-muted hover:text-text-primary disabled:opacity-0 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 px-4 py-2 bg-energy-teal text-surface-default rounded-lg text-label-md font-semibold hover:brightness-110 transition-all"
                        >
                            {currentStep === anchors.length - 1 ? 'Got it' : 'Next'}
                            {currentStep !== anchors.length - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </GlassPanel>

            {/* CSS for highlight effect */}
            <style>{`
                .briefing-highlight {
                    position: relative;
                    z-index: 51;
                    box-shadow: 0 0 0 4px rgba(0, 209, 178, 0.3), 0 0 20px rgba(0, 209, 178, 0.2);
                    border-radius: 8px;
                    transition: box-shadow 0.3s ease;
                }
            `}</style>
        </div>
    );
};

export default BriefingTour;
