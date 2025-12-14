/**
 * PROMPT ARCHITECT - Zustand Store
 * src/lib/prompt-architect/prompt-architect-store.ts
 * 
 * State management with localStorage persistence for panel state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    PromptArchitectState,
    PanelConfig,
    ArchitectContext,
    ArchitectMode,
    OutputTab,
    GeneratedPrompt,
    ClarificationQuestion,
    GroundingConfig,
    GroundingProvider,
    DEFAULT_PANEL_CONFIG,
    DEFAULT_CONTEXT,
    DEFAULT_MODEL,
    DEFAULT_GROUNDING_CONFIG,
} from './types';
import { analyzeClarity } from './clarity-analyzer';
import { generatePromptFromIntent } from './prompt-generator';
import { retrievalSearch, type RetrievalResultItem } from '../retrieval/client';

// ============================================================
// Initial State
// ============================================================

const initialState = {
    // Panel state
    panelConfig: DEFAULT_PANEL_CONFIG,
    isVisible: false,

    // Content state
    mode: 'precise' as ArchitectMode,
    intent: '',
    context: DEFAULT_CONTEXT,
    generatedPrompt: null as GeneratedPrompt | null,
    clarificationQuestions: [] as ClarificationQuestion[],
    clarificationAnswers: {} as Record<string, string>,

    // UI state
    activeTab: 'prompt' as OutputTab,
    selectedModel: DEFAULT_MODEL,
    isGenerating: false,
    status: 'idle' as const,
    errorMessage: undefined as string | undefined,

    // Grounding state
    groundingConfig: DEFAULT_GROUNDING_CONFIG,
    isFetchingSources: false,
};

// ============================================================
// Store Creation
// ============================================================

export const usePromptArchitectStore = create<PromptArchitectState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========================
            // Panel Actions
            // ========================

            show: (context?: ArchitectContext) => {
                set({
                    isVisible: true,
                    panelConfig: {
                        ...get().panelConfig,
                        state: get().panelConfig.state === 'hidden' ? 'docked' : get().panelConfig.state,
                    },
                    ...(context && { context }),
                });
            },

            hide: () => {
                set({
                    isVisible: false,
                    panelConfig: {
                        ...get().panelConfig,
                        state: 'hidden',
                    },
                });
            },

            toggle: () => {
                const { isVisible } = get();
                if (isVisible) {
                    get().hide();
                } else {
                    get().show();
                }
            },

            updatePanelConfig: (config: Partial<PanelConfig>) => {
                set({
                    panelConfig: {
                        ...get().panelConfig,
                        ...config,
                    },
                });
            },

            // ========================
            // Content Actions
            // ========================

            setMode: (mode: ArchitectMode) => {
                set({ mode });
                // Re-generate if we have a prompt
                if (get().generatedPrompt) {
                    get().generatePrompt();
                }
            },

            setIntent: (intent: string) => {
                set({
                    intent,
                    status: 'idle',
                    generatedPrompt: null,
                    clarificationQuestions: [],
                    clarificationAnswers: {},
                });
            },

            setContext: (context: ArchitectContext) => {
                set({ context });
            },

            mergeContext: (partialContext: Partial<ArchitectContext>) => {
                set({
                    context: {
                        ...get().context,
                        ...partialContext,
                    },
                });
            },

            // ========================
            // UI Actions
            // ========================

            setActiveTab: (activeTab: OutputTab) => {
                set({ activeTab });
            },

            setSelectedModel: (selectedModel: string) => {
                set({ selectedModel });
            },

            answerClarification: (id: string, answer: string) => {
                const answers = { ...get().clarificationAnswers, [id]: answer };
                set({ clarificationAnswers: answers });

                // Check if all required questions are answered
                const questions = get().clarificationQuestions;
                const allAnswered = questions
                    .filter(q => q.required)
                    .every(q => answers[q.id] && answers[q.id].trim() !== '');

                if (allAnswered) {
                    set({ status: 'idle' });
                    // Auto-generate when all questions answered
                    get().generatePrompt();
                }
            },

            // ========================
            // Prompt Generation
            // ========================

            generatePrompt: async () => {
                const { intent, mode, context, clarificationAnswers, selectedModel, groundingConfig } = get();

                if (!intent.trim()) {
                    set({ status: 'idle', errorMessage: undefined });
                    return;
                }

                set({ status: 'analyzing', isGenerating: true, errorMessage: undefined });

                try {
                    // Step 1: Analyze clarity
                    const clarityResult = analyzeClarity(intent, context);

                    if (!clarityResult.isClear && clarityResult.questions.length > 0) {
                        // Need clarification
                        set({
                            status: 'needs-clarification',
                            clarificationQuestions: clarityResult.questions,
                            isGenerating: false,
                        });
                        return;
                    }

                    // Step 1.5: Fetch sources if grounding is enabled
                    let sources: RetrievalResultItem[] = [];
                    if (groundingConfig.enabled) {
                        set({ isFetchingSources: true });

                        const searchResult = await retrievalSearch({
                            query: intent,
                            provider: groundingConfig.provider,
                            maxResults: groundingConfig.maxResults,
                            includeSnippets: true,
                        });

                        set({ isFetchingSources: false });

                        if (searchResult.success && searchResult.results.length > 0) {
                            sources = searchResult.results;
                        } else if (!searchResult.success) {
                            // Log but don't fail - grounding is optional
                            console.warn('Grounding search failed:', searchResult.error);
                        }
                    }

                    // Step 2: Generate prompt (with sources if available)
                    set({ status: 'generating' });

                    const generatedPrompt = await generatePromptFromIntent({
                        intent,
                        mode,
                        context,
                        clarificationAnswers,
                        selectedModel,
                        detectedOutputType: clarityResult.detectedOutputType,
                        sources,
                        groundingEnabled: groundingConfig.enabled,
                    });

                    set({
                        generatedPrompt,
                        status: 'ready',
                        isGenerating: false,
                        activeTab: groundingConfig.enabled && sources.length > 0 ? 'sources' : 'prompt',
                    });

                } catch (error) {
                    set({
                        status: 'error',
                        errorMessage: error instanceof Error ? error.message : 'Failed to generate prompt',
                        isGenerating: false,
                        isFetchingSources: false,
                    });
                }
            },

            updatePromptContent: (field: 'primary' | 'system' | 'negative', content: string) => {
                const current = get().generatedPrompt;
                if (!current) return;

                set({
                    generatedPrompt: {
                        ...current,
                        [field]: content,
                    },
                });
            },

            // ========================
            // Reset Actions
            // ========================

            reset: () => {
                set({
                    ...initialState,
                    // Keep panel config and preferences for persistence
                    panelConfig: get().panelConfig,
                    selectedModel: get().selectedModel,
                    mode: get().mode,
                    groundingConfig: get().groundingConfig,
                });
            },

            clearContent: () => {
                set({
                    intent: '',
                    generatedPrompt: null,
                    clarificationQuestions: [],
                    clarificationAnswers: {},
                    status: 'idle',
                    errorMessage: undefined,
                    activeTab: 'prompt',
                });
            },

            // ========================
            // Grounding Actions
            // ========================

            setGroundingEnabled: (enabled: boolean) => {
                set({
                    groundingConfig: {
                        ...get().groundingConfig,
                        enabled,
                    },
                });
            },

            setGroundingProvider: (provider: GroundingProvider) => {
                set({
                    groundingConfig: {
                        ...get().groundingConfig,
                        provider,
                    },
                });
            },

            setGroundingMaxResults: (maxResults: number) => {
                // Clamp between 3 and 8
                const clampedMax = Math.min(Math.max(maxResults, 3), 8);
                set({
                    groundingConfig: {
                        ...get().groundingConfig,
                        maxResults: clampedMax,
                    },
                });
            },

            updateGroundingConfig: (config: Partial<GroundingConfig>) => {
                set({
                    groundingConfig: {
                        ...get().groundingConfig,
                        ...config,
                    },
                });
            },
        }),
        {
            name: 'codra-prompt-architect',
            // Persist panel configuration, preferences, and grounding config
            partialize: (state) => ({
                panelConfig: state.panelConfig,
                mode: state.mode,
                selectedModel: state.selectedModel,
                groundingConfig: state.groundingConfig,
            }),
        }
    )
);

// ============================================================
// Selector Hooks
// ============================================================

/** Check if panel is in docked mode */
export const useIsDocked = () =>
    usePromptArchitectStore(state => state.panelConfig.state === 'docked');

/** Check if panel is in floating mode */
export const useIsFloating = () =>
    usePromptArchitectStore(state => state.panelConfig.state === 'floating');

/** Get current dock position */
export const useDockPosition = () =>
    usePromptArchitectStore(state => state.panelConfig.dockPosition);

/** Check if prompt is ready to run */
export const useIsPromptReady = () =>
    usePromptArchitectStore(state => state.status === 'ready' && state.generatedPrompt !== null);

/** Check if clarification is needed */
export const useNeedsClarification = () =>
    usePromptArchitectStore(state => state.status === 'needs-clarification');
