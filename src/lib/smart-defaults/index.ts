/**
 * SMART DEFAULTS INDEX
 * Main exports for the Smart Defaults system
 */

// Core types
export type {
    AccountSettings,
    ProjectSettings,
    EffectiveSettings,
    ProjectContext,
    QualityPriority,
    DataSensitivity,
    VisualDirection,
    DeskId,
    SpendingStrategy,
    AutonomyLevel,
    ThemePreference,
    ExportFormat,
    AccountTier,
    UserHistory,
    BehaviorEventType,
    BehaviorEvent,
    TaskPattern,
    TaskOverride,
    TaskOverrideSettings,
    TierDefaults,
} from '../../domain/smart-defaults-types';

// Constants
export { SMART_DEFAULTS, SETTINGS_LABELS, SETTINGS_DESCRIPTIONS } from '../../domain/smart-defaults-types';

// Hooks
export { useAccountSettings } from './hooks/useAccountSettings';
export { useProjectSettings } from './hooks/useProjectSettings';
export { useEffectiveSettings } from './hooks/useEffectiveSettings';
export { useUserTier } from './hooks/useUserTier';

// Inference engines
export { StaticInferenceEngine, inferenceEngine } from './inference-engine';
export { RuleBasedInferenceEngine, ruleBasedInferenceEngine, getInferredSettings } from './inference-engine';

// Behavior tracking
export { behaviorTracker } from './inference-engine';
export { BehaviorTracker } from '../tracking/BehaviorTracker';

// Settings management
export { getDefaultsForTier, TIER_DEFAULTS } from '../settings/TierDefaults';
export { getEffectiveSettings } from '../settings/EffectiveSettings';
export {
    applyTaskOverrides,
    getTaskOverridesById,
    clearTaskOverrides,
    saveTaskPattern,
    getTaskPattern,
    deleteTaskPattern,
    getAllTaskPatterns,
} from '../settings/TaskOverrides';
