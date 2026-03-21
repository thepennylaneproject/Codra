/**
 * src/lib/templates/runner.ts
 * 
 * Template Runner v1 - the execution spine.
 * Deterministic, boring, always emits receipts.
 * 
 * The runner is the ONLY place that calls governed primitives:
 * - ImagePolicy for image resolution
 * - (Future: model routing, cost preflight)
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  TemplateDefinition,
  TemplateImageSlot,
  TemplateRunContext,
  TemplateRunResult,
  TemplateRunReceipt,
  RunTemplateOptions,
  RunTemplateOutput,
  ResolvedImageSlot,
  ResolvedCanonicalImage,
  ResolvedGeneratedImage,
  ReceiptSlotSummary,
  ReceiptError,
  TemplateErrorCode,
  RegistryConfig,
  ImageSlotFailurePolicy,
} from './types';
import { getTemplate } from './registry';
import {
  mergeWithDefaults,
  executeImagePolicy,
  isImagePolicyError,
  type ImagePolicy,
  type ExecutionContext,
  type PolicyResult,
} from '../image-policy';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a stable runId if not provided.
 */
function resolveRunId(providedRunId?: string): string {
  if (providedRunId && typeof providedRunId === 'string' && providedRunId.trim()) {
    return providedRunId.trim();
  }
  return uuidv4();
}

/**
 * Get the effective failure policy for a slot.
 */
function getEffectiveFailurePolicy(slot: TemplateImageSlot): ImageSlotFailurePolicy {
  if (slot.onFail) {
    return slot.onFail;
  }
  // Default: fail-template if required, continue otherwise
  return slot.required ? 'fail-template' : 'continue';
}

/**
 * Build an ImagePolicy from slot overrides.
 */
function buildSlotPolicy(slot: TemplateImageSlot): Partial<ImagePolicy> {
  const partial: Partial<ImagePolicy> = {};
  
  if (slot.mode) {
    partial.mode = slot.mode;
  }
  
  if (slot.selection) {
    partial.selection = slot.selection as ImagePolicy['selection'];
  }
  
  if (slot.generation) {
    partial.generation = slot.generation as ImagePolicy['generation'];
  }
  
  return partial;
}

/**
 * Convert PolicyResult to ResolvedImageSlot.
 */
function policyResultToResolvedSlot(
  slot: TemplateImageSlot,
  result: PolicyResult,
  policy: ImagePolicy,
  registryVersion: string | number
): ResolvedImageSlot {
  const canonicalAssets: ResolvedCanonicalImage[] = result.canonicalAssets.map((asset) => ({
    source: 'canonical',
    assetId: asset.assetId,
    cloudinaryPublicId: asset.cloudinaryPublicId,
    url: asset.url,
    reason: asset.reason,
  }));
  
  const generatedImages: ResolvedGeneratedImage[] = result.generatedImages.map((generatedImage) => ({
    source: 'generated',
    provider: generatedImage.provider,
    model: generatedImage.model,
    url: generatedImage.output.url,
    width: generatedImage.output.width,
    height: generatedImage.output.height,
    format: generatedImage.output.format,
    reason: generatedImage.reason,
  }));
  
  return {
    slotId: slot.slotId,
    purpose: slot.purpose,
    policyMode: policy.mode,
    registryMode: policy.registrySnapshot,
    registryVersion,
    success: result.success,
    canonicalAssets,
    generatedImages,
    errorCode: result.errorCode,
    errorReason: result.errorDetails?.message,
    resolverReason: result.errorDetails?.unmetConstraints?.join('; '),
  };
}

/**
 * Convert ResolvedImageSlot to ReceiptSlotSummary.
 */
function slotToReceiptSummary(slot: ResolvedImageSlot): ReceiptSlotSummary {
  return {
    slotId: slot.slotId,
    purpose: slot.purpose,
    policyMode: slot.policyMode,
    registryMode: slot.registryMode,
    registryVersion: slot.registryVersion,
    success: slot.success,
    canonicalCount: slot.canonicalAssets.length,
    generatedCount: slot.generatedImages.length,
    errorCode: slot.errorCode,
    reason: slot.errorReason,
    resolverReason: slot.resolverReason,
  };
}

/**
 * Create an error receipt entry.
 */
function createReceiptError(
  code: TemplateErrorCode,
  message: string,
  details?: Record<string, unknown>
): ReceiptError {
  return { code, message, details };
}

/**
 * Create a failure receipt.
 */
function createFailureReceipt(
  runId: string,
  templateId: string,
  startedAt: string,
  errors: ReceiptError[],
  imageSlots?: ReceiptSlotSummary[],
  templateVersion?: string
): TemplateRunReceipt {
  return {
    runId,
    templateId,
    templateVersion,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: 'failure',
    imageSlots,
    errors,
  };
}

/**
 * Create a success receipt.
 */
function createSuccessReceipt(
  runId: string,
  templateId: string,
  templateVersion: string,
  startedAt: string,
  imageSlots?: ReceiptSlotSummary[]
): TemplateRunReceipt {
  return {
    runId,
    templateId,
    templateVersion,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: 'success',
    imageSlots,
  };
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

interface ValidationResult {
  valid: boolean;
  errors: ReceiptError[];
}

/**
 * Lightweight input validation for v1.
 */
function validateInputs(
  templateId: unknown,
  inputs: unknown,
  options: RunTemplateOptions
): ValidationResult {
  const errors: ReceiptError[] = [];
  
  // templateId must be a non-empty string
  if (typeof templateId !== 'string' || !templateId.trim()) {
    errors.push(createReceiptError(
      'TEMPLATE_INVALID_INPUT',
      'templateId must be a non-empty string'
    ));
  }
  
  // inputs must be an object (or undefined/null which we'll default)
  if (inputs !== undefined && inputs !== null && typeof inputs !== 'object') {
    errors.push(createReceiptError(
      'TEMPLATE_INVALID_INPUT',
      'inputs must be an object'
    ));
  }
  
  // availableCredits must be a number
  if (typeof options.availableCredits !== 'number' || !Number.isFinite(options.availableCredits)) {
    errors.push(createReceiptError(
      'TEMPLATE_INVALID_INPUT',
      'context.availableCredits must be a finite number'
    ));
  }
  
  // hasConsent must be a boolean
  if (typeof options.hasConsent !== 'boolean') {
    errors.push(createReceiptError(
      'TEMPLATE_INVALID_INPUT',
      'context.hasConsent must be a boolean'
    ));
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// SLOT RESOLUTION
// =============================================================================

interface SlotResolutionResult {
  resolvedImages: Record<string, ResolvedImageSlot>;
  slotSummaries: ReceiptSlotSummary[];
  errors: ReceiptError[];
  shouldFailTemplate: boolean;
}

/**
 * Resolve all image slots for a template.
 */
async function resolveImageSlots(
  template: TemplateDefinition,
  runId: string,
  options: RunTemplateOptions
): Promise<SlotResolutionResult> {
  const slots = template.imageSlots ?? [];
  const resolvedImages: Record<string, ResolvedImageSlot> = {};
  const slotSummaries: ReceiptSlotSummary[] = [];
  const errors: ReceiptError[] = [];
  let shouldFailTemplate = false;
  
  for (const slot of slots) {
    try {
      // Build merged policy for this slot
      const slotOverrides = buildSlotPolicy(slot);
      const mergedPolicy = mergeWithDefaults(slotOverrides);
      
      // Build execution context
      const execContext: ExecutionContext = {
        runId,
        availableCredits: options.availableCredits,
        hasConsent: options.hasConsent,
        template: {
          templateId: template.templateId,
          templateName: template.name,
          pinnedRegistryVersion: typeof options.registry?.versionId === 'number' 
            ? options.registry.versionId 
            : undefined,
        },
      };
      
      // Execute the policy
      const policyResult = await executeImagePolicy(mergedPolicy, execContext);
      
      // Get registry version from receipt or use placeholder
      const registryVersion = policyResult.receipt?.registryVersion ?? 'unknown';
      
      // Convert to resolved slot
      const resolved = policyResultToResolvedSlot(slot, policyResult, mergedPolicy, registryVersion);
      resolvedImages[slot.slotId] = resolved;
      slotSummaries.push(slotToReceiptSummary(resolved));
      
      // Check if this slot failure should fail the template
      if (!policyResult.success) {
        const failurePolicy = getEffectiveFailurePolicy(slot);
        
        if (failurePolicy === 'fail-template') {
          shouldFailTemplate = true;
          errors.push(createReceiptError(
            slot.required ? 'IMAGE_SLOT_REQUIRED' : 'IMAGE_SLOT_FAILED',
            `Image slot '${slot.slotId}' failed: ${policyResult.errorDetails?.message ?? 'unknown error'}`,
            {
              slotId: slot.slotId,
              purpose: slot.purpose,
              imagePolicyErrorCode: policyResult.errorCode,
            }
          ));
        }
      }
    } catch (error) {
      // Handle unexpected errors during slot resolution
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failurePolicy = getEffectiveFailurePolicy(slot);
      
      // Create a failed slot entry
      const failedSlot: ResolvedImageSlot = {
        slotId: slot.slotId,
        purpose: slot.purpose,
        policyMode: slot.mode ?? 'canonical-only',
        registryMode: options.registry?.mode ?? 'pinned',
        registryVersion: options.registry?.versionId ?? 'unknown',
        success: false,
        canonicalAssets: [],
        generatedImages: [],
        errorCode: isImagePolicyError(error) ? error.code : 'INTERNAL_ERROR',
        errorReason: errorMessage,
      };
      
      resolvedImages[slot.slotId] = failedSlot;
      slotSummaries.push(slotToReceiptSummary(failedSlot));
      
      if (failurePolicy === 'fail-template') {
        shouldFailTemplate = true;
        errors.push(createReceiptError(
          slot.required ? 'IMAGE_SLOT_REQUIRED' : 'IMAGE_SLOT_FAILED',
          `Image slot '${slot.slotId}' threw error: ${errorMessage}`,
          {
            slotId: slot.slotId,
            purpose: slot.purpose,
          }
        ));
      }
    }
  }
  
  return { resolvedImages, slotSummaries, errors, shouldFailTemplate };
}

// =============================================================================
// MAIN RUNNER
// =============================================================================

/**
 * Run a template.
 * 
 * Always returns a receipt, even for failures.
 * This is the core contract of the template runner.
 */
export async function runTemplate(
  templateId: string,
  inputs: Record<string, unknown>,
  options: RunTemplateOptions
): Promise<RunTemplateOutput> {
  const runId = resolveRunId(options.runId);
  const startedAt = new Date().toISOString();
  const registry: RegistryConfig = options.registry ?? { mode: 'pinned' };
  
  // Step 1: Validate inputs
  const validation = validateInputs(templateId, inputs, options);
  if (!validation.valid) {
    return {
      result: null,
      resolvedImages: null,
      receipt: createFailureReceipt(runId, String(templateId), startedAt, validation.errors),
    };
  }
  
  // Step 2: Load template from registry
  const template = getTemplate(templateId);
  if (!template) {
    return {
      result: null,
      resolvedImages: null,
      receipt: createFailureReceipt(
        runId,
        templateId,
        startedAt,
        [createReceiptError('TEMPLATE_NOT_FOUND', `Template '${templateId}' not found`)]
      ),
    };
  }
  
  // Step 3: Resolve image slots (if any)
  const slotResolution = await resolveImageSlots(template, runId, options);
  
  // Check if slot failures should stop us
  if (slotResolution.shouldFailTemplate) {
    return {
      result: null,
      resolvedImages: slotResolution.resolvedImages,
      receipt: createFailureReceipt(
        runId,
        templateId,
        startedAt,
        slotResolution.errors,
        slotResolution.slotSummaries,
        template.version
      ),
    };
  }
  
  // Step 4: Build run context
  const runContext: TemplateRunContext = {
    runId,
    templateId: template.templateId,
    inputs: inputs ?? {},
    availableCredits: options.availableCredits,
    hasConsent: options.hasConsent,
    registry,
    resolvedImages: slotResolution.resolvedImages,
  };
  
  // Step 5: Execute the template
  let result: TemplateRunResult;
  try {
    result = await template.run(runContext);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      result: null,
      resolvedImages: slotResolution.resolvedImages,
      receipt: createFailureReceipt(
        runId,
        templateId,
        startedAt,
        [
          ...slotResolution.errors,
          createReceiptError(
            'TEMPLATE_RUN_FAILED',
            `Template execution failed: ${errorMessage}`,
            { stack: error instanceof Error ? error.stack : undefined }
          ),
        ],
        slotResolution.slotSummaries,
        template.version
      ),
    };
  }
  
  // Step 6: Return success
  return {
    result,
    resolvedImages: slotResolution.resolvedImages,
    receipt: createSuccessReceipt(
      runId,
      templateId,
      template.version,
      startedAt,
      slotResolution.slotSummaries.length > 0 ? slotResolution.slotSummaries : undefined
    ),
  };
}
