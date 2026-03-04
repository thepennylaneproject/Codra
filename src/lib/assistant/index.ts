/**
 * ASSISTANT MODULE INDEX
 */

export { AssistantProvider, useAssistant, useAssistantOptional } from './AssistantContext';
export {
    generateContextualPrompt,
    suggestNextArtifacts,
    generateClarifyingQuestions,
    buildInitialAssistantState,
    buildPromptContext,
} from './AssistantPromptEngine';
export type { PromptContext, ArtifactSuggestion, ClarifyingQuestion } from './AssistantPromptEngine';

// Assistant Observer (Proactive Nudges)
export {
    evaluateTriggers,
    buildNudgeContext,
    dismissNudge,
    DEFAULT_NUDGE_TRIGGERS,
} from './AssistantObserver';
export type {
    AssistantNudge,
    NudgeTrigger,
    NudgeContext,
    NudgeCategory,
    NudgePriority,
} from './AssistantObserver';
