/**
 * src/lib/image-policy/index.ts
 * 
 * Main export file for the ImagePolicy module.
 */

// Types
export type {
    ImagePolicy,
    ImagePolicyMode,
    RegistrySnapshotMode,
    SelectionConstraints,
    GenerationConfig,
    GenerationOutput,
    PromptRules,
    BudgetConfig,
    ProvenanceConfig,
    PromotionConfig,
    CanonicalAsset,
    SelectedAsset,
    GeneratedImage,
    ResolverOutput,
    PolicyReceipt,
    PolicyResult,
    TemplateMetadata,
    AspectClass,
    SizeClass,
    ImageRole,
    EnergyLevel,
    LifecycleStatus,
    ProductFamily,
    VariantTag,
    AllowedFormat,
    RetentionMode,
} from './types';

// Errors
export {
    ImagePolicyError,
    PolicyMissingError,
    NoCanonicalMatchError,
    GenerationDisabledError,
    GenerationConsentRequiredError,
    GenerationBudgetExceededError,
    PromotionNotAllowedError,
    PromotionMissingFieldsError,
    isImagePolicyError,
    getErrorCode,
} from './errors';

// Defaults
export {
    DEFAULT_IMAGE_POLICY,
    EXPLORATION_IMAGE_POLICY,
    DEFAULT_SELECTION,
    DEFAULT_GENERATION,
    DEFAULT_BUDGET,
    DEFAULT_PROVENANCE,
    DEFAULT_PROMOTION,
    mergeWithDefaults,
    validatePolicy,
} from './defaults';

// Registry
export {
    loadSnapshot,
    getCurrentVersion,
    clearCache,
    getRegistryStats,
    type RegistrySnapshot,
} from './canonical-registry';

// Resolver
export {
    resolveAssets,
    filterAssets,
    rankAssets,
    dedupeAssets,
} from './resolver';

// Generation Gate
export {
    checkGenerationGate,
    estimateGenerationCost,
    canGenerate,
    type GenerationGateResult,
    type GenerationGateContext,
} from './generation-gate';

// Receipt Builder
export {
    buildReceipt,
    buildMinimalReceipt,
    serializeReceipt,
    summarizeReceipt,
} from './receipt-builder';

// Policy Executor
export {
    executeImagePolicy,
    ensurePolicy,
    getDefaultPolicy,
    type ExecutionContext,
} from './policy-executor';

// Promotion
export {
    requestPromotion,
    approvePromotion,
    rejectPromotion,
    canPromote,
    validatePromotionMetadata,
    type PromotionMetadata,
    type PromotionResult,
    type PromotionRequest,
} from './promotion';

// Enrichment
export {
    EnrichmentEngine,
    type AnalysisResults,
    type EnrichmentOutput,
} from './enrichment-engine';
