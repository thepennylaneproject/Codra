/**
 * PROMPT ARCHITECT - Library Exports
 * src/lib/prompt-architect/index.ts
 */

// Types
export * from './types';

// Store
export { usePromptArchitectStore, useIsDocked, useIsFloating, useDockPosition, useIsPromptReady, useNeedsClarification } from './prompt-architect-store';

// Context
export { PromptArchitectProvider, usePromptArchitect, usePromptArchitectDirect } from './PromptArchitectContext';

// Logic
export { analyzeClarity } from './clarity-analyzer';
export { generatePromptFromIntent, reEstimateCost } from './prompt-generator';
