/**
 * FIRST PROJECT STEP
 * Create the first project with AI guidance
 */

import React, { useState } from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';
import type { UserRole, PrimaryUseCase } from '../../../lib/onboarding/onboarding-store';
import { useProjectStore } from '../../../lib/store/project-store';

interface FirstProjectStepProps {
    userProfile: {
        role?: UserRole;
        useCase?: PrimaryUseCase;
    };
    onComplete: (projectId: string) => void;
    onSkip: () => void;
    onBack: () => void;
}

export const FirstProjectStep: React.FC<FirstProjectStepProps> = ({
    userProfile,
    onComplete,
    onSkip,
    onBack,
}) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Store actions
    const addProject = useProjectStore(state => state.addProject);
    const setCurrentProject = useProjectStore(state => state.setCurrentProject);

    const SUGGESTIONS = [
        "A marketing dashboard for a SaaS product",
        "A Python script to scrape news headlines",
        "A landing page for a coffee shop",
        "A resume parser microservice"
    ];

    const handleCreate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);

        // Simulate AI generation delay
        await new Promise(r => setTimeout(r, 1500));

        // Create real project in store
        const projectId = crypto.randomUUID();
        const cleanTitle = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;

        addProject({
            id: projectId,
            userId: 'current-user', // Should come from auth context in real app

            // Identity
            title: cleanTitle,
            summary: prompt,
            domain: 'other', // Default for "magic" creation

            // Goals
            primaryGoal: 'Build an initial prototype based on user prompt',
            secondaryGoals: [],

            // Audience
            targetUsers: [],

            // Technical
            techStack: {},

            // Constraints
            constraints: {
                budgetLevel: 'medium',
                timeline: 'normal',
                complexityTolerance: 'moderate',
            },

            // Brand
            brand: {
                voiceTags: [],
                adjectives: [],
                bannedWords: [],
            },

            // Metadata
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        setCurrentProject(projectId);

        setIsGenerating(false);
        onComplete(projectId);
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-heading-sm text-text-primary">What do you want to build?</h3>
                <p className="text-body-sm text-text-muted">
                    Describe your idea and we'll scaffold it for you.
                </p>
            </div>

            {/* Input Area */}
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A personal blog with a markdown editor'..."
                    className="w-full h-32 p-4 bg-background-default border border-border-subtle rounded-xl resize-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all placeholder:text-text-soft"
                />
                <div className="absolute bottom-3 right-3">
                    <button
                        onClick={handleCreate}
                        disabled={!prompt.trim() || isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-forge text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                generate
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-label-xs text-text-muted uppercase tracking-wider">
                    <Lightbulb className="w-3 h-3" />
                    <span>Suggestions for {userProfile.role || 'you'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUGGESTIONS.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => setPrompt(suggestion)}
                            className="text-left px-3 py-2 text-body-sm text-text-secondary bg-background-subtle hover:bg-background-elevated border border-transparent hover:border-border-subtle rounded-lg transition-all truncate"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={onBack}
                    className="text-text-muted hover:text-text-primary px-4 py-2 rounded transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onSkip}
                    className="text-text-soft hover:text-text-muted px-4 py-2 rounded transition-colors text-label-sm"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
};
