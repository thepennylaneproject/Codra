/**
 * src/lib/ai/provider-utils.ts
 *
 * Shared utilities for AI provider implementations.
 */

import type { ModelInfo } from './types';

/**
 * Estimates the cost of a completion using a provider-specific model catalog.
 *
 * Each AI provider maintains its own `MODEL_CATALOG`. This helper centralises
 * the cost calculation so the identical formula does not need to be repeated
 * inside every provider class.
 *
 * Returns 0 when the model is not found in the catalog.
 *
 * @param catalog  The provider's model catalog keyed by model ID.
 * @param model    The model ID used for the completion.
 * @param promptTokens     Number of prompt tokens consumed.
 * @param completionTokens Number of completion tokens generated.
 */
export function estimateCostFromCatalog(
  catalog: Record<string, ModelInfo>,
  model: string,
  promptTokens: number,
  completionTokens = 0,
): number {
  const modelInfo = catalog[model];
  if (!modelInfo) return 0;
  return (
    (promptTokens / 1000) * modelInfo.costPer1kPrompt +
    (completionTokens / 1000) * modelInfo.costPer1kCompletion
  );
}
