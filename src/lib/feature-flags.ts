import posthog from 'posthog-js';

/**
 * FEATURE FLAG DEFINITIONS
 * Central registry for all feature flags used in the application.
 */
export const FEATURE_FLAGS = {
  MODEL_COST_EXPLAINER: 'model-cost-explainer',
  TASK_REPLAY_FEATURE: 'task-replay-feature',
  BUDGET_WIDGET: 'budget-widget',
  ARTIFACT_APPROVAL_WORKFLOW: 'artifact-approval-workflow',
  SMART_CONTEXT_IMPORT: 'smart-context-import',
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

/**
 * Check if a feature flag is enabled.
 * Useful for non-React contexts or one-off checks.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return posthog.isFeatureEnabled(flag) ?? false;
}

/**
 * Get all active feature flags.
 */
export function getActiveFlags(): string[] {
  return posthog.getFeatureFlagPayloads() ? Object.keys(posthog.getFeatureFlagPayloads()) : [];
}
