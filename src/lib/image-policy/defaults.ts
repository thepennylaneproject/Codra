/**
 * src/lib/image-policy/defaults.ts
 * 
 * Global default ImagePolicy (Section 11 of spec).
 * Strict, sustainable defaults that favor canonical assets over generation.
 */

import type {
    ImagePolicy,
    SelectionConstraints,
    GenerationConfig,
    BudgetConfig,
    ProvenanceConfig,
    PromotionConfig,
} from './types';

// =============================================================================
// DEFAULT SUB-CONFIGS
// =============================================================================

/**
 * Default selection constraints - permissive filtering.
 */
export const DEFAULT_SELECTION: SelectionConstraints = {
    maxAssets: 3,
    dedupe: true,
    minWidth: 0,
    minHeight: 0,
    allowedFormats: ['png', 'jpg', 'webp', 'svg'],
    role: 'any',
    energy: 'any',
    lifecycleStatus: 'approved',
    aspect: 'any',
    transparent: 'any',
    sizeClass: 'any',
    requiredTags: [],
    forbiddenTags: [],
    productFamily: 'any',
    variant: 'any',
    assetClass: 'any',
    vectorType: 'mixed',
    complexity: 'low',
    isInvertible: false,
    isThemable: false,
};

/**
 * Default generation config - generation disabled.
 */
export const DEFAULT_GENERATION: GenerationConfig = {
    enabled: false,
    maxGenerations: 0,
    allowedProviders: [],
    allowedModels: [],
    output: {
        count: 1,
        width: 1024,
        height: 1024,
        transparentBackground: false,
        format: 'png',
    },
    promptRules: {
        mustInclude: [],
        mustNotInclude: [],
        stylePreset: undefined,
    },
};

/**
 * Default budget config - consent required.
 */
export const DEFAULT_BUDGET: BudgetConfig = {
    maxCredits: null,
    requireConsent: true,
};

/**
 * Default provenance config - ephemeral 30-day retention.
 */
export const DEFAULT_PROVENANCE: ProvenanceConfig = {
    attachToReceipt: true,
    storeGenerations: 'ephemeral',
    retentionDays: 30,
};

/**
 * Default promotion config - promotion disabled.
 */
export const DEFAULT_PROMOTION: PromotionConfig = {
    allowPromotion: false,
    requiresHumanApproval: true,
    requiredFields: ['role', 'productFamily', 'variant', 'tags'],
};

// =============================================================================
// COMPLETE DEFAULT POLICY
// =============================================================================

/**
 * The global default ImagePolicy.
 * 
 * This is a strict, sustainable default:
 * - Mode: canonical-only (never generates)
 * - Snapshot: pinned for templates
 * - Selection: permissive (allows most formats/sizes)
 * - Generation: disabled
 * - Retention: ephemeral 30 days
 * - Promotion: disabled
 */
export const DEFAULT_IMAGE_POLICY: ImagePolicy = {
    mode: 'canonical-only',
    registrySnapshot: 'pinned',
    selection: DEFAULT_SELECTION,
    generation: DEFAULT_GENERATION,
    budget: DEFAULT_BUDGET,
    provenance: DEFAULT_PROVENANCE,
    promotion: DEFAULT_PROMOTION,
};

/**
 * A more permissive default for ad-hoc exploration.
 * Uses latest registry and prefer-canonical mode.
 */
export const EXPLORATION_IMAGE_POLICY: ImagePolicy = {
    mode: 'prefer-canonical',
    registrySnapshot: 'latest',
    selection: DEFAULT_SELECTION,
    generation: {
        ...DEFAULT_GENERATION,
        enabled: true,
        maxGenerations: 3,
    },
    budget: {
        maxCredits: 10,
        requireConsent: true,
    },
    provenance: DEFAULT_PROVENANCE,
    promotion: DEFAULT_PROMOTION,
};

// =============================================================================
// POLICY MERGING
// =============================================================================

/**
 * Deep merge a partial policy with defaults.
 * Ensures all required fields are present.
 */
export function mergeWithDefaults(partial: Partial<ImagePolicy>): ImagePolicy {
    return {
        mode: partial.mode ?? DEFAULT_IMAGE_POLICY.mode,
        registrySnapshot: partial.registrySnapshot ?? DEFAULT_IMAGE_POLICY.registrySnapshot,
        selection: {
            ...DEFAULT_SELECTION,
            ...partial.selection,
        },
        generation: {
            ...DEFAULT_GENERATION,
            ...partial.generation,
            output: {
                ...DEFAULT_GENERATION.output,
                ...partial.generation?.output,
            },
            promptRules: {
                ...DEFAULT_GENERATION.promptRules,
                ...partial.generation?.promptRules,
            },
        },
        budget: {
            ...DEFAULT_BUDGET,
            ...partial.budget,
        },
        provenance: {
            ...DEFAULT_PROVENANCE,
            ...partial.provenance,
        },
        promotion: {
            ...DEFAULT_PROMOTION,
            ...partial.promotion,
        },
    };
}

/**
 * Validate that a policy is internally consistent.
 * Returns list of validation errors (empty if valid).
 */
export function validatePolicy(policy: ImagePolicy): string[] {
    const errors: string[] = [];
    
    // Generation must be disabled unless mode allows it
    if (policy.mode === 'canonical-only' && policy.generation.enabled) {
        errors.push('generation.enabled must be false when mode is canonical-only');
    }
    
    // maxAssets must be non-negative
    if (policy.selection.maxAssets < 0) {
        errors.push('selection.maxAssets must be >= 0');
    }
    
    // maxGenerations must be non-negative
    if (policy.generation.maxGenerations < 0) {
        errors.push('generation.maxGenerations must be >= 0');
    }
    
    // retentionDays must be positive for ephemeral
    if (policy.provenance.storeGenerations === 'ephemeral' && policy.provenance.retentionDays <= 0) {
        errors.push('provenance.retentionDays must be > 0 for ephemeral storage');
    }
    
    // Output dimensions must be positive
    if (policy.generation.output.width <= 0 || policy.generation.output.height <= 0) {
        errors.push('generation.output dimensions must be > 0');
    }
    
    return errors;
}
