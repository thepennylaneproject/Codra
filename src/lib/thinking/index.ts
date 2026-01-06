/**
 * Thinking Workspace Core Library
 *
 * The cognitive engine behind Codra's thinking model.
 */

// Types
export * from './types';

// Fragment normalization
export {
  classifyFragment,
  classifyFragmentType,
  classifyFragmentDomain,
  classifyFragmentSentiment,
  normalizeFragment,
  findSimilarFragments,
  findFragmentToUpgrade,
  extractThemes,
} from './fragment-normalizer';

// Lyra pattern detection
export {
  detectAllPatterns,
  detectRecurringThemes,
  detectContradictions,
  detectEmotionalWeight,
  detectMissingPieces,
  detectPivotPoints,
  generateReflection,
  selectObservationsToSurface,
  updateShadowFromPatterns,
} from './lyra-pattern-detector';

// AI-powered classification
export {
  createAIClassifier,
  createHybridClassifier,
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationUserPrompt,
  type AIFragmentType,
  type AIFragmentStrength,
  type AIFragmentDomain,
  type AIClassificationResult,
  type ClassifierProvider,
  type HybridClassifierConfig,
} from './ai-classifier';
