/**
 * LYRA MODULE INDEX
 */

export { LyraProvider, useLyra, useLyraOptional } from './LyraContext';
export {
    generateContextualPrompt,
    suggestNextArtifacts,
    generateClarifyingQuestions,
    buildInitialLyraState,
    buildPromptContext,
} from './LyraPromptEngine';
export type { PromptContext, ArtifactSuggestion, ClarifyingQuestion } from './LyraPromptEngine';

// Lyra Observer (Proactive Nudges)
export {
    evaluateTriggers,
    buildNudgeContext,
    dismissNudge,
    DEFAULT_NUDGE_TRIGGERS,
} from './LyraObserver';
export type {
    LyraNudge,
    NudgeTrigger,
    NudgeContext,
    NudgeCategory,
    NudgePriority,
} from './LyraObserver';
