/**
 * src/lib/templates/types.ts
 * 
 * Core types for the Template Runner v1.
 * Templates are pure functions that declare inputs, image slots, and produce outputs.
 * All external calls (ImagePolicy, future model routing) go through the runner, not template.run().
 */

import type { ImagePolicy, ImagePolicyMode, RegistrySnapshotMode } from '../image-policy';

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Stable error code namespace for template runner.
 * All errors crossing the API boundary use these codes.
 */
export type TemplateErrorCode =
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_INVALID_INPUT'
  | 'TEMPLATE_RUN_FAILED'
  | 'IMAGE_SLOT_FAILED'
  | 'IMAGE_SLOT_REQUIRED'
  | 'INTERNAL_ERROR';

// =============================================================================
// IMAGE SLOT TYPES
// =============================================================================

/**
 * Purpose tags for image slots.
 * Aligns with common template use cases.
 */
export type ImageSlotPurpose = 'hero' | 'background' | 'texture' | 'illustration' | 'accent';

/**
 * Failure policy for image slots.
 * - `continue`: Slot failure doesn't fail the template (default for optional slots)
 * - `fail-template`: Slot failure fails the entire template run
 */
export type ImageSlotFailurePolicy = 'continue' | 'fail-template';

/**
 * Image slot declaration for a template.
 * Slots define what images the template needs and how to resolve them.
 */
export interface TemplateImageSlot {
  /** Unique identifier for this slot within the template */
  slotId: string;
  
  /** Semantic purpose of the image (affects default policy) */
  purpose: ImageSlotPurpose;
  
  /** Whether this slot is required for the template to succeed */
  required?: boolean;
  
  /** What to do when slot resolution fails (default: 'continue' if not required, 'fail-template' if required) */
  onFail?: ImageSlotFailurePolicy;
  
  /** Override the policy mode for this slot */
  mode?: ImagePolicyMode;
  
  /** Partial selection constraints to merge with defaults */
  selection?: Partial<ImagePolicy['selection']>;
  
  /** Partial generation config to merge with defaults */
  generation?: Partial<ImagePolicy['generation']>;
}

// =============================================================================
// TEMPLATE DEFINITION
// =============================================================================

/**
 * A template definition.
 * Templates are registered in the registry and executed by the runner.
 * 
 * CONSTRAINT: template.run() must be pure. It must NOT:
 * - Call external APIs
 * - Access databases
 * - Perform I/O
 * - Generate random values (use runId for determinism)
 * 
 * The runner is the only place that calls governed primitives.
 */
export interface TemplateDefinition {
  /** Unique template identifier */
  templateId: string;
  
  /** Human-readable name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** Template version (semver recommended) */
  version: string;
  
  /** Optional JSON schema for inputs validation */
  inputsSchema?: Record<string, unknown>;
  
  /** Image slots this template uses (resolved before run) */
  imageSlots?: TemplateImageSlot[];
  
  /**
   * The pure template function.
   * Receives context with resolved images and produces output.
   * Must NOT perform side effects.
   */
  run: (ctx: TemplateRunContext) => Promise<TemplateRunResult>;
}

// =============================================================================
// RUN CONTEXT
// =============================================================================

/**
 * Registry mode for template execution.
 */
export interface RegistryConfig {
  /** Whether to use latest or pinned registry */
  mode: RegistrySnapshotMode;
  
  /** Specific version ID if pinned */
  versionId?: string | number;
}

/**
 * Context passed to template.run().
 */
export interface TemplateRunContext {
  /** Unique run identifier (server-generated or client-provided) */
  runId: string;
  
  /** Template being executed */
  templateId: string;
  
  /** User-provided inputs */
  inputs: Record<string, unknown>;
  
  /** User's available credits for generation */
  availableCredits: number;
  
  /** Whether user has consented to generation costs */
  hasConsent: boolean;
  
  /** Registry configuration */
  registry: RegistryConfig;
  
  /** Resolved images from imageSlots (keyed by slotId) */
  resolvedImages: Record<string, ResolvedImageSlot>;
}

// =============================================================================
// RESOLVED IMAGES
// =============================================================================

/**
 * A resolved image from canonical registry.
 */
export interface ResolvedCanonicalImage {
  source: 'canonical';
  assetId: string;
  cloudinaryPublicId: string;
  url: string;
  reason: string;
}

/**
 * A resolved image from generation.
 */
export interface ResolvedGeneratedImage {
  source: 'generated';
  provider: string;
  model: string;
  url: string;
  width: number;
  height: number;
  format: string;
  reason: string;
}

/**
 * Resolved image slot with all assets and metadata.
 */
export interface ResolvedImageSlot {
  /** Slot ID */
  slotId: string;
  
  /** Slot purpose */
  purpose: ImageSlotPurpose;
  
  /** Policy mode actually applied (after mergeWithDefaults) */
  policyMode: ImagePolicyMode;
  
  /** Registry mode actually used */
  registryMode: RegistrySnapshotMode;
  
  /** Registry version actually used */
  registryVersion: string | number;
  
  /** Whether slot resolution succeeded */
  success: boolean;
  
  /** Canonical assets resolved */
  canonicalAssets: ResolvedCanonicalImage[];
  
  /** Generated images (if any) */
  generatedImages: ResolvedGeneratedImage[];
  
  /** Error code if failed */
  errorCode?: string;
  
  /** Error reason if failed */
  errorReason?: string;
  
  /** Resolver reasoning string */
  resolverReason?: string;
}

// =============================================================================
// RUN RESULT
// =============================================================================

/**
 * Result from template.run().
 */
export interface TemplateRunResult {
  /** Template output (shape defined by template) */
  output: Record<string, unknown>;
}

// =============================================================================
// RUN RECEIPT
// =============================================================================

/**
 * Slot summary in the run receipt.
 */
export interface ReceiptSlotSummary {
  /** Slot ID */
  slotId: string;
  
  /** Slot purpose */
  purpose: ImageSlotPurpose;
  
  /** Policy mode actually applied */
  policyMode: ImagePolicyMode;
  
  /** Registry mode used */
  registryMode: RegistrySnapshotMode;
  
  /** Registry version used */
  registryVersion: string | number;
  
  /** Whether slot succeeded */
  success: boolean;
  
  /** Count of canonical assets resolved */
  canonicalCount: number;
  
  /** Count of generated images */
  generatedCount: number;
  
  /** Error code if failed */
  errorCode?: string;
  
  /** Error reason if failed */
  reason?: string;
  
  /** Resolver reasoning */
  resolverReason?: string;
}

/**
 * Error entry in the run receipt.
 */
export interface ReceiptError {
  /** Stable error code */
  code: TemplateErrorCode;
  
  /** Human-readable message */
  message: string;
  
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Complete run receipt.
 * Always emitted, even for failures.
 */
export interface TemplateRunReceipt {
  /** Unique run identifier */
  runId: string;
  
  /** Template that was executed (or attempted) */
  templateId: string;
  
  /** Template version (if found) */
  templateVersion?: string;
  
  /** Run start timestamp (ISO 8601) */
  startedAt: string;
  
  /** Run finish timestamp (ISO 8601) */
  finishedAt: string;
  
  /** Final status */
  status: 'success' | 'failure';
  
  /** Image slot summaries (if any slots were processed) */
  imageSlots?: ReceiptSlotSummary[];
  
  /** Errors encountered */
  errors?: ReceiptError[];
}

// =============================================================================
// RUNNER INPUT/OUTPUT
// =============================================================================

/**
 * Options for running a template.
 */
export interface RunTemplateOptions {
  /** Optional client-provided runId for idempotency/tracing */
  runId?: string;
  
  /** User's available credits */
  availableCredits: number;
  
  /** Whether user has consented to generation */
  hasConsent: boolean;
  
  /** Registry configuration */
  registry?: RegistryConfig;
}

/**
 * Result from runTemplate().
 * Receipt is ALWAYS present.
 */
export interface RunTemplateOutput {
  /** Template result (null if failed before run) */
  result: TemplateRunResult | null;
  
  /** Resolved images (null if failed before slot resolution) */
  resolvedImages: Record<string, ResolvedImageSlot> | null;
  
  /** Run receipt (always present) */
  receipt: TemplateRunReceipt;
}
