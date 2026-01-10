/**
 * Model Registry - Main Export
 * 
 * Central export point for the Living Model Registry system.
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
    ModelStatus,
    ModelRegistryEventType,
    ModelCapabilities,
    ModelRegistryRecord,
    ModelHealthRecord,
    ModelScoresRecord,
    ModelRegistryEventRecord,
    DiscoveredModel,
    SmokeTestResult,
    ModelHealthSummary,
    ModelScoreSummary,
    EnrichedModelRecord,
} from './registry/registry-types';

// ============================================================================
// ADAPTERS
// ============================================================================

export type { ModelProviderAdapter, AdapterConfig } from './adapters/adapter';
export { BaseProviderAdapter } from './adapters/adapter';
export { AimlapiAdapter } from './adapters/aimlapi-adapter';
export { OpenAIAdapter } from './adapters/openai-adapter';
export {
    getAdapter,
    getAllAdapters,
    getRegisteredProviders,
    registerAdapter,
} from './adapters/adapter-registry';

// ============================================================================
// REGISTRY SERVICE
// ============================================================================

export type { RegistryConfig } from './registry/registry-service';
export { RegistryService, getRegistryService } from './registry/registry-service';

// ============================================================================
// EVAL RUNNER
// ============================================================================

export type { EvalConfig, EvalFixture, EvalResult, SuiteResult, ModelEvalResult } from './evals/eval-runner';
export { EvalRunner, getEvalRunner } from './evals/eval-runner';
export { validateOutput, calculateScore, type Validator, type ValidationResult } from './evals/validators';

// ============================================================================
// POLICY ROUTER
// ============================================================================

export type {
    TaskType,
    RiskLevel,
    RoutingRequest,
    RoutingDecision,
    RoutingConfig,
} from './routing/policy-router';
export { selectModel, routeRequest } from './routing/policy-router';
