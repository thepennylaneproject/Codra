/**
 * ASSISTANT CONTEXT
 * React context provider for Assistant state
 */

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { AssistantState, AssistantAppearance, ProjectSpecification, ProjectToolId } from '../../domain/types';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import {
    buildInitialAssistantState,
    buildPromptContext,
    suggestNextArtifacts,
    generateClarifyingQuestions,
    ArtifactSuggestion,
    ClarifyingQuestion,
} from './AssistantPromptEngine';
import { DEFAULT_ASSISTANT_APPEARANCE } from './AssistantRegistry';
import {
    AssistantNudge,
    evaluateTriggers,
    buildNudgeContext,
    dismissNudge as dismissNudgeUtil,
} from './AssistantObserver';

// ============================================
// Context Types
// ============================================

interface AssistantContextValue {
    // State
    state: AssistantState;
    suggestions: ArtifactSuggestion[];
    questions: ClarifyingQuestion[];
    nudges: AssistantNudge[];

    // Actions
    show: () => void;
    hide: () => void;
    toggle: () => void;
    setAppearance: (appearance: Partial<AssistantAppearance>) => void;
    refreshContext: (specification: ProjectSpecification, profile: ExtendedOnboardingProfile | null) => void;
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

const DEFAULT_STATE: AssistantState = {
    visible: true,
    appearance: DEFAULT_ASSISTANT_APPEARANCE,
    suggestedArtifacts: [],
    confidence: 0.5,
    pendingQuestions: [],
};

// ============================================
// Context
// ============================================

const AssistantContext = createContext<AssistantContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface AssistantProviderProps {
    children: ReactNode;
    initialSpecification?: ProjectSpecification;
    initialProfile?: ExtendedOnboardingProfile | null;
}

export function AssistantProvider({ children, initialSpecification, initialProfile }: AssistantProviderProps) {
    // Core state
    const [state, setState] = useState<AssistantState>(() => {
        // Build initial prompt-based state
        let initialState = DEFAULT_STATE;

        if (initialSpecification && initialProfile) {
            const context = buildPromptContext(initialSpecification, initialProfile);
            const activeTools = (initialProfile?.context?.creativeGoals || []) as unknown as ProjectToolId[];
            initialState = { ...initialState, ...buildInitialAssistantState(context, activeTools) };
        }

        // Merge with stored appearance preferences
        const storedAppearance = localStorage.getItem('codra:assistant:appearance');
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

    // Current specification & profile for context building
    const [currentSpecification, setCurrentSpecification] = useState<ProjectSpecification | undefined>(initialSpecification);
    const [currentProfile, setCurrentProfile] = useState<ExtendedOnboardingProfile | null | undefined>(initialProfile);
    const [currentSectionId, setCurrentSectionId] = useState<string | undefined>();

    // Nudges state
    const [nudges, setNudges] = useState<AssistantNudge[]>([]);
    const [sessionStartedAt] = useState(() => new Date().toISOString());

    // Computed suggestions and questions
    const suggestions = useMemo(() => {
        if (!currentProfile) return [];
        const activeTools = (currentProfile?.context?.creativeGoals || []) as unknown as ProjectToolId[];
        return suggestNextArtifacts(activeTools);
    }, [currentProfile]);

    const questions = useMemo(() => {
        if (!currentSpecification || !currentProfile) return [];
        const context = buildPromptContext(currentSpecification, currentProfile, currentSectionId);
        return generateClarifyingQuestions(context, state.confidence);
    }, [currentSpecification, currentProfile, currentSectionId, state.confidence]);

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

    const setAppearance = useCallback((patch: Partial<AssistantAppearance>) => {
        setState(prev => {
            const updatedAppearance = { ...prev.appearance, ...patch };
            // Ensure nested layers are merged if patch contains layers
            if (patch.layers) {
                updatedAppearance.layers = { ...prev.appearance.layers, ...patch.layers };
            }

            localStorage.setItem('codra:assistant:appearance', JSON.stringify(updatedAppearance));
            return {
                ...prev,
                appearance: updatedAppearance
            };
        });
    }, []);

    const refreshContext = useCallback((specification: ProjectSpecification, profile: ExtendedOnboardingProfile | null) => {
        setCurrentSpecification(specification);
        setCurrentProfile(profile);

        const context = buildPromptContext(specification, profile, currentSectionId);
        const activeTools = (profile?.context?.creativeGoals || []) as unknown as ProjectToolId[];
        const newState = buildInitialAssistantState(context, activeTools);

        setState(newState);
    }, [currentSectionId]);

    const focusSection = useCallback((sectionId: string) => {
        setCurrentSectionId(sectionId);

        if (currentSpecification && currentProfile) {
            const context = buildPromptContext(currentSpecification, currentProfile, sectionId);
            setState(prev => ({
                ...prev,
                currentPrompt: context.currentSection?.title,
            }));
        }
    }, [currentSpecification, currentProfile]);

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
    const value: AssistantContextValue = {
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
        <AssistantContext.Provider value={value}>
            {children}
        </AssistantContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useAssistant(): AssistantContextValue {
    const context = useContext(AssistantContext);
    if (!context) {
        throw new Error('useAssistant must be used within an AssistantProvider');
    }
    return context;
}

// Optional hook for components that may be outside provider
export function useAssistantOptional(): AssistantContextValue | null {
    return useContext(AssistantContext);
}
