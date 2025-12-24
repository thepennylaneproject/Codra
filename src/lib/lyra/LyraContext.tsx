/**
 * LYRA CONTEXT
 * React context provider for Lyra assistant state
 */

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { LyraState, LyraAppearance, Spread, ProductionDeskId } from '../../domain/types';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import {
    buildInitialLyraState,
    buildPromptContext,
    suggestNextArtifacts,
    generateClarifyingQuestions,
    ArtifactSuggestion,
    ClarifyingQuestion,
} from './LyraPromptEngine';
import { DEFAULT_LYRA_APPEARANCE } from './LyraRegistry';
import {
    LyraNudge,
    evaluateTriggers,
    buildNudgeContext,
    dismissNudge as dismissNudgeUtil,
} from './LyraObserver';

// ============================================
// Context Types
// ============================================

interface LyraContextValue {
    // State
    state: LyraState;
    suggestions: ArtifactSuggestion[];
    questions: ClarifyingQuestion[];
    nudges: LyraNudge[];

    // Actions
    show: () => void;
    hide: () => void;
    toggle: () => void;
    setAppearance: (appearance: Partial<LyraAppearance>) => void;
    refreshContext: (spread: Spread, profile: ExtendedOnboardingProfile | null) => void;
    focusSection: (sectionId: string) => void;
    dismissQuestion: (questionId: string) => void;

    // Nudge Actions
    dismissNudge: (nudgeId: string) => void;
    checkForNudges: (context: {
        budgetTotal?: number;
        budgetSpent?: number;
        tasks?: { status: string; updatedAt: string }[];
        sections?: { id: string; updatedAt: string }[];
        regenerationCount?: number;
    }) => void;
}

const DEFAULT_STATE: LyraState = {
    visible: true,
    appearance: DEFAULT_LYRA_APPEARANCE,
    suggestedArtifacts: [],
    confidence: 0.5,
    pendingQuestions: [],
};

// ============================================
// Context
// ============================================

const LyraContext = createContext<LyraContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface LyraProviderProps {
    children: ReactNode;
    initialSpread?: Spread;
    initialProfile?: ExtendedOnboardingProfile | null;
}

export function LyraProvider({ children, initialSpread, initialProfile }: LyraProviderProps) {
    // Core state
    const [state, setState] = useState<LyraState>(() => {
        // Build initial prompt-based state
        let initialState = DEFAULT_STATE;

        if (initialSpread && initialProfile) {
            const context = buildPromptContext(initialSpread, initialProfile);
            const activeDesks = (initialProfile?.context?.creativeGoals || []) as unknown as ProductionDeskId[];
            initialState = { ...initialState, ...buildInitialLyraState(context, activeDesks) };
        }

        // Merge with stored appearance preferences
        const storedAppearance = localStorage.getItem('codra:lyra:appearance');
        if (storedAppearance) {
            try {
                const appearance = JSON.parse(storedAppearance);
                initialState = { ...initialState, appearance };
            } catch {
                // Keep default
            }
        }

        return initialState;
    });

    // Current spread & profile for context building
    const [currentSpread, setCurrentSpread] = useState<Spread | undefined>(initialSpread);
    const [currentProfile, setCurrentProfile] = useState<ExtendedOnboardingProfile | null | undefined>(initialProfile);
    const [currentSectionId, setCurrentSectionId] = useState<string | undefined>();

    // Nudges state
    const [nudges, setNudges] = useState<LyraNudge[]>([]);
    const [sessionStartedAt] = useState(() => new Date().toISOString());

    // Computed suggestions and questions
    const suggestions = useMemo(() => {
        if (!currentProfile) return [];
        const activeDesks = (currentProfile?.context?.creativeGoals || []) as unknown as ProductionDeskId[];
        return suggestNextArtifacts(activeDesks);
    }, [currentProfile]);

    const questions = useMemo(() => {
        if (!currentSpread || !currentProfile) return [];
        const context = buildPromptContext(currentSpread, currentProfile, currentSectionId);
        return generateClarifyingQuestions(context, state.confidence);
    }, [currentSpread, currentProfile, currentSectionId, state.confidence]);

    // Actions
    const show = useCallback(() => {
        setState(prev => ({ ...prev, visible: true }));
    }, []);

    const hide = useCallback(() => {
        setState(prev => ({ ...prev, visible: false }));
    }, []);

    const toggle = useCallback(() => {
        setState(prev => ({ ...prev, visible: !prev.visible }));
    }, []);

    const setAppearance = useCallback((patch: Partial<LyraAppearance>) => {
        setState(prev => {
            const updatedAppearance = { ...prev.appearance, ...patch };
            // Ensure nested layers are merged if patch contains layers
            if (patch.layers) {
                updatedAppearance.layers = { ...prev.appearance.layers, ...patch.layers };
            }

            localStorage.setItem('codra:lyra:appearance', JSON.stringify(updatedAppearance));
            return {
                ...prev,
                appearance: updatedAppearance
            };
        });
    }, []);

    const refreshContext = useCallback((spread: Spread, profile: ExtendedOnboardingProfile | null) => {
        setCurrentSpread(spread);
        setCurrentProfile(profile);

        const context = buildPromptContext(spread, profile, currentSectionId);
        const activeDesks = (profile?.context?.creativeGoals || []) as unknown as ProductionDeskId[];
        const newState = buildInitialLyraState(context, activeDesks);

        setState(newState);
    }, [currentSectionId]);

    const focusSection = useCallback((sectionId: string) => {
        setCurrentSectionId(sectionId);

        if (currentSpread && currentProfile) {
            const context = buildPromptContext(currentSpread, currentProfile, sectionId);
            setState(prev => ({
                ...prev,
                currentPrompt: context.currentSection?.title,
            }));
        }
    }, [currentSpread, currentProfile]);

    const dismissQuestion = useCallback((questionId: string) => {
        setState(prev => ({
            ...prev,
            pendingQuestions: prev.pendingQuestions.filter(q => q !== questionId),
        }));
    }, []);

    // Nudge Actions
    const dismissNudge = useCallback((nudgeId: string) => {
        setNudges(prev => dismissNudgeUtil(nudgeId, prev));
    }, []);

    const checkForNudges = useCallback((context: {
        budgetTotal?: number;
        budgetSpent?: number;
        tasks?: { status: string; updatedAt: string }[];
        sections?: { id: string; updatedAt: string }[];
        regenerationCount?: number;
    }) => {
        const nudgeContext = buildNudgeContext({
            ...context,
            currentSectionId,
            sessionStartedAt,
        });

        const newNudges = evaluateTriggers(nudgeContext);
        if (newNudges.length > 0) {
            setNudges(prev => [...prev, ...newNudges]);
        }
    }, [currentSectionId, sessionStartedAt]);

    // Context value
    const value: LyraContextValue = {
        state,
        suggestions,
        questions,
        nudges,
        show,
        hide,
        toggle,
        setAppearance,
        refreshContext,
        focusSection,
        dismissQuestion,
        dismissNudge,
        checkForNudges,
    };

    return (
        <LyraContext.Provider value={value}>
            {children}
        </LyraContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useLyra(): LyraContextValue {
    const context = useContext(LyraContext);
    if (!context) {
        throw new Error('useLyra must be used within a LyraProvider');
    }
    return context;
}

// Optional hook for components that may be outside provider
export function useLyraOptional(): LyraContextValue | null {
    return useContext(LyraContext);
}
