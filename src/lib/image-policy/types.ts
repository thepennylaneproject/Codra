/**
 * src/lib/image-policy/types.ts
 * 
 * Core types for the ImagePolicy specification v1.0
 * Governs how templates and workflows select canonical assets and/or generate images.
 */

// =============================================================================
// POLICY MODES
// =============================================================================

/**
 * Policy mode controlling the boundary between canonical and generated images.
 * 
 * - `canonical-only`: Only select from canonical registry, never generate
 * - `prefer-canonical`: Try canonical first, generate only if no match and allowed
 * - `generate-ok`: May generate immediately, but should try canonical first
 */
export type ImagePolicyMode = 'canonical-only' | 'prefer-canonical' | 'generate-ok';

/**
 * Registry snapshot strategy for reproducibility.
 * 
 * - `pinned`: Use the template's pinned registry version
 * - `latest`: Use the latest registry version
 */
export type RegistrySnapshotMode = 'pinned' | 'latest';

// =============================================================================
// SELECTION CONSTRAINTS
// =============================================================================

/** Aspect ratio categories for filtering */
export type AspectClass = 'any' | 'square' | 'portrait' | 'landscape' | 'panorama';

/** Size class categories matching asset metadata */
export type SizeClass = 'any' | 'icon' | 'small' | 'card' | 'hero' | 'texture';

/** Functional roles for deterministic selection */
export type ImageRole = 
    | 'any'
    | 'background-soft'
    | 'background-structured'
    | 'background-dynamic'
    | 'texture_paper'
    | 'texture_grain'
    | 'texture_grid'
    | 'texture_organic'
    | 'texture_industrial'
    | 'hero'
    | 'feature_card'
    | 'list_item'
    | 'icon'
    | 'spot_illustration'
    | 'other';

/** Visual energy levels */
export type EnergyLevel = 'any' | 'low' | 'medium' | 'high';

/** Asset lifecycle stages */
export type LifecycleStatus = 'any' | 'draft' | 'approved' | 'deprecated';

/** Product brand tags (Product Families) */
export type ProductFamily = 'any' | 'relevnt_core' | 'deepwater' | 'steel' | 'diamond' | 'pro' | 'starter' | 'other';

/** Asset class categories */
export type AssetClass = 'any' | 'raster' | 'vector';

/** Vector-specific types */
export type VectorType = 'stroke' | 'filled' | 'mixed';

/** Complexity levels for performance/rendering decisions */
export type ComplexityLevel = 'low' | 'medium' | 'high';

/** Visual variant tags */
export type VariantTag = 'any' | 'light' | 'dark' | 'mono' | 'accent';

/** Allowed image formats */
export type AllowedFormat = 'png' | 'jpg' | 'webp' | 'svg';

/**
 * Selection constraints for filtering canonical assets.
 */
export interface SelectionConstraints {
    /** Maximum number of assets to return */
    maxAssets: number;
    
    /** Whether to deduplicate similar assets */
    dedupe: boolean;
    
    /** Minimum width in pixels (0 = no minimum) */
    minWidth: number;
    
    /** Minimum height in pixels (0 = no minimum) */
    minHeight: number;
    
    /** Allowed image formats */
    allowedFormats: AllowedFormat[];
    
    /** Primary functional role */
    role: ImageRole;

    /** Visual energy level */
    energy: EnergyLevel;

    /** Lifecycle status filter (defaults to 'approved' for production) */
    lifecycleStatus: LifecycleStatus;
    
    /** Aspect ratio constraint */
    aspect: AspectClass;

    /** Whether background must be transparent ('any' | 'true' | 'false') */
    transparent: 'any' | 'true' | 'false';
    
    /** Size class constraint */
    sizeClass: SizeClass;
    
    /** Required tags (asset must have ALL of these) */
    requiredTags: string[];
    
    /** Forbidden tags (asset must have NONE of these) */
    forbiddenTags: string[];
    
    /** Product brand constraint (Family) */
    productFamily: ProductFamily;
    
    /** Visual variant constraint */
    variant: VariantTag;

    /** Asset class constraint */
    assetClass: AssetClass;

    /** Vector-specific constraints */
    vectorType?: VectorType;
    complexity?: ComplexityLevel;
    isInvertible?: boolean;
    isThemable?: boolean;
}

// =============================================================================
// GENERATION CONFIG
// =============================================================================

/** Output format for generated images */
export type GenerationOutputFormat = 'png' | 'jpg' | 'webp';

/**
 * Output specifications for image generation.
 */
export interface GenerationOutput {
    /** Number of images to generate */
    count: number;
    
    /** Output width in pixels */
    width: number;
    
    /** Output height in pixels */
    height: number;
    
    /** Whether to generate with transparent background */
    transparentBackground: boolean;
    
    /** Output format */
    format: GenerationOutputFormat;
}

/**
 * Prompt rules constraining generation.
 */
export interface PromptRules {
    /** Terms that MUST appear in prompts */
    mustInclude: string[];
    
    /** Terms that MUST NOT appear in prompts */
    mustNotInclude: string[];
    
    /** Optional style preset identifier */
    stylePreset?: string;
}

/**
 * Configuration for image generation.
 */
export interface GenerationConfig {
    /** Whether generation is enabled */
    enabled: boolean;
    
    /** Maximum number of generations allowed per policy execution */
    maxGenerations: number;
    
    /** Allowed provider identifiers */
    allowedProviders: string[];
    
    /** Allowed model identifiers */
    allowedModels: string[];
    
    /** Output specifications */
    output: GenerationOutput;
    
    /** Prompt constraint rules */
    promptRules: PromptRules;
}

// =============================================================================
// BUDGET & CONSENT
// =============================================================================

/**
 * Budget and consent configuration for generation costs.
 */
export interface BudgetConfig {
    /** Maximum credits to spend (null = unlimited) */
    maxCredits: number | null;
    
    /** Whether user consent is required before generation */
    requireConsent: boolean;
}

// =============================================================================
// PROVENANCE & RETENTION
// =============================================================================

/**
 * Retention mode for generated images.
 * 
 * - `none`: Do not store
 * - `ephemeral`: Store temporarily, expires after retentionDays
 * - `retained`: Store indefinitely but marked as generated
 */
export type RetentionMode = 'none' | 'ephemeral' | 'retained';

/**
 * Provenance and retention configuration.
 */
export interface ProvenanceConfig {
    /** Whether to attach policy metadata to execution receipts */
    attachToReceipt: boolean;
    
    /** How to store generated images */
    storeGenerations: RetentionMode;
    
    /** Days to retain ephemeral images */
    retentionDays: number;
}

// =============================================================================
// PROMOTION
// =============================================================================

/**
 * Configuration for promoting generated images to canonical registry.
 */
export interface PromotionConfig {
    /** Whether promotion workflow is allowed */
    allowPromotion: boolean;
    
    /** Whether human approval is required */
    requiresHumanApproval: boolean;
    
    /** Required metadata fields for promotion */
    requiredFields: ('role' | 'productFamily' | 'variant' | 'tags')[];
}

// =============================================================================
// MAIN POLICY OBJECT
// =============================================================================

/**
 * Complete ImagePolicy configuration.
 * 
 * Every template or workflow that may involve images MUST declare an imagePolicy.
 */
export interface ImagePolicy {
    /** Policy mode controlling canonical vs generated boundary */
    mode: ImagePolicyMode;
    
    /** Registry snapshot strategy */
    registrySnapshot: RegistrySnapshotMode;
    
    /** Selection constraints for canonical assets */
    selection: SelectionConstraints;
    
    /** Generation configuration */
    generation: GenerationConfig;
    
    /** Budget and consent settings */
    budget: BudgetConfig;
    
    /** Provenance and retention settings */
    provenance: ProvenanceConfig;
    
    /** Promotion workflow settings */
    promotion: PromotionConfig;
}

// =============================================================================
// CANONICAL ASSET
// =============================================================================

/**
 * A canonical asset from the registry.
 */
export interface CanonicalAsset {
    /** Unique asset identifier */
    assetId: string;
    
    /** Cloudinary public ID */
    cloudinaryPublicId: string;
    
    /** Full URL to asset */
    cloudinaryUrl: string;
    
    /** Asset tags */
    tags: string[];
    
    /** Primary functional role (Structured Metadata) */
    role: string;

    /** Visual energy level (Structured Metadata) */
    energy?: string;

    /** Asset class (Structured Metadata) */
    assetClass: AssetClass;

    /** Vector-specific metadata (Structured Metadata) */
    vectorType?: VectorType;
    isInvertible?: boolean;
    isThemable?: boolean;
    complexity?: ComplexityLevel;

    /** Lifecycle status (Structured Metadata) */
    lifecycleStatus?: string;

    /** Product brand tag (Structured Metadata) */
    productFamily?: string;
    
    /** Computed aspect ratio class */
    aspectClass: string;
    
    /** Computed size class */
    sizeClass: string;
    
    /** Image format */
    format: string;
    
    /** Width in pixels */
    width: number;
    
    /** Height in pixels */
    height: number;
    
    /** File size in bytes */
    bytes: number;
    
    /** Visual variant tag */
    variant?: string;
    
    /** Whether background is transparent (Structured Metadata) */
    transparent?: boolean | null;
    
    /** Creation timestamp */
    createdAt: string;
}

// =============================================================================
// RESOLVER OUTPUT
// =============================================================================

/**
 * A selected asset with selection reason.
 */
export interface SelectedAsset {
    /** Source type */
    source: 'canonical';
    
    /** Asset ID */
    assetId: string;
    
    /** Cloudinary public ID */
    cloudinaryPublicId: string;
    
    /** Full URL */
    url: string;
    
    /** Human-readable selection reason */
    reason: string;
}

/**
 * Output from the deterministic asset resolver.
 */
export interface ResolverOutput {
    /** Selected assets (may be empty) */
    assets: SelectedAsset[];
    
    /** Human-readable overall reason */
    reason: string;
    
    /** Registry version used */
    registryVersion: string | number;
    
    /** Constraints that could not be satisfied */
    unmetConstraints: string[];
}

// =============================================================================
// GENERATED IMAGE
// =============================================================================

/**
 * A generated image record.
 */
export interface GeneratedImage {
    /** Source type */
    source: 'generated';
    
    /** Provider used */
    provider: string;
    
    /** Model used */
    model: string;
    
    /** SHA-256 hash of the prompt */
    promptHash: string;
    
    /** Creation timestamp */
    createdAt: string;
    
    /** Output details */
    output: {
        url: string;
        width: number;
        height: number;
        format: string;
        transparentBackground: boolean;
    };
    
    /** Human-readable generation reason */
    reason: string;
}

// =============================================================================
// POLICY RECEIPT
// =============================================================================

/**
 * Execution receipt for observability.
 * Attached when provenance.attachToReceipt is true.
 */
export interface PolicyReceipt {
    /** Unique receipt ID */
    id: string;
    
    /** Execution run ID */
    runId: string;
    
    /** Template ID if applicable */
    templateId?: string;
    
    /** Workflow ID if applicable */
    workflowId?: string;
    
    /** Normalized policy used */
    policy: ImagePolicy;
    
    /** Registry version used */
    registryVersion: string | number;
    
    /** Canonical assets selected */
    canonicalAssets: SelectedAsset[];
    
    /** Generated outputs */
    generatedOutputs: GeneratedImage[];
    
    /** Credit spend estimate */
    creditEstimate: number;
    
    /** Actual credit spend */
    creditActual: number;
    
    /** Timestamp */
    createdAt: string;
}

// =============================================================================
// POLICY RESULT
// =============================================================================

/**
 * Result from executing an image policy.
 */
export interface PolicyResult {
    /** Whether execution succeeded */
    success: boolean;
    
    /** Selected canonical assets */
    canonicalAssets: SelectedAsset[];
    
    /** Generated images (if any) */
    generatedImages: GeneratedImage[];
    
    /** Error code if failed */
    errorCode?: string;
    
    /** Error details if failed */
    errorDetails?: {
        message: string;
        unmetConstraints?: string[];
        nextAction?: string;
    };
    
    /** Execution receipt */
    receipt?: PolicyReceipt;
}

// =============================================================================
// TEMPLATE & FLOW INTEGRATION
// =============================================================================

/**
 * Metadata passed to the resolver from template context.
 */
export interface TemplateMetadata {
    /** Template ID */
    templateId: string;
    
    /** Template name */
    templateName?: string;
    
    /** Execution context hints */
    contextHints?: Record<string, string>;
    
    /** Pinned registry version (for registrySnapshot: 'pinned') */
    pinnedRegistryVersion?: number;
}
