/**
 * src/lib/image-policy/policy-executor.ts
 * 
 * Main orchestrator for image policy execution (Section 4 of spec).
 * Implements the three policy modes: canonical-only, prefer-canonical, generate-ok.
 */

import type {
    ImagePolicy,
    TemplateMetadata,
    PolicyResult,
    SelectedAsset,
    GeneratedImage,
} from './types';
import { PolicyMissingError, NoCanonicalMatchError, isImagePolicyError } from './errors';
import { DEFAULT_IMAGE_POLICY, mergeWithDefaults, validatePolicy } from './defaults';
import { loadSnapshot, type RegistrySnapshot } from './canonical-registry';
import { resolveAssets } from './resolver';
import { checkGenerationGate, canGenerate, type GenerationGateContext } from './generation-gate';
import { buildReceipt } from './receipt-builder';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Execution context for policy runs.
 */
export interface ExecutionContext {
    /** Unique run identifier */
    runId: string;
    
    /** User's available credits */
    availableCredits: number;
    
    /** Whether user has consented to generation */
    hasConsent: boolean;
    
    /** Template metadata */
    template: TemplateMetadata;
    
    /** Optional: function to generate images */
    generateImage?: (prompt: string, options: Record<string, unknown>) => Promise<GeneratedImage>;
    
    /** Optional: prompt to use for generation */
    generationPrompt?: string;
}

// =============================================================================
// POLICY ENFORCEMENT
// =============================================================================

/**
 * Ensure a policy is present and valid.
 * Returns the merged/validated policy or throws PolicyMissingError.
 */
export function ensurePolicy(
    policy: ImagePolicy | undefined,
    templateId?: string
): ImagePolicy {
    if (policy === undefined) {
        throw new PolicyMissingError(templateId);
    }
    
    // Merge with defaults to ensure all fields are present
    const merged = mergeWithDefaults(policy);
    
    // Validate internal consistency
    const errors = validatePolicy(merged);
    if (errors.length > 0) {
        throw new Error(`Invalid ImagePolicy: ${errors.join('; ')}`);
    }
    
    return merged;
}

/**
 * Get the default policy (for templates without explicit policy).
 */
export function getDefaultPolicy(): ImagePolicy {
    return { ...DEFAULT_IMAGE_POLICY };
}

// =============================================================================
// MODE EXECUTORS
// =============================================================================

/**
 * Execute canonical-only mode.
 * Only selects from registry, never generates.
 */
async function executeCanonicalOnly(
    policy: ImagePolicy,
    context: ExecutionContext,
    snapshot: RegistrySnapshot
): Promise<PolicyResult> {
    const resolverOutput = resolveAssets(
        policy,
        context.template,
        snapshot.assets,
        snapshot.version
    );
    
    // If no assets found, return error
    if (resolverOutput.assets.length === 0) {
        const error = new NoCanonicalMatchError(
            resolverOutput.unmetConstraints,
            resolverOutput.reason
        );
        
        return {
            success: false,
            canonicalAssets: [],
            generatedImages: [],
            errorCode: error.code,
            errorDetails: {
                message: error.message,
                unmetConstraints: resolverOutput.unmetConstraints,
                nextAction: 'Relax selection constraints or switch to prefer-canonical mode',
            },
            receipt: policy.provenance.attachToReceipt ? buildReceipt(
                context.runId,
                policy,
                snapshot.version,
                [],
                [],
                { estimate: 0, actual: 0 },
                { templateId: context.template.templateId }
            ) : undefined,
        };
    }
    
    return {
        success: true,
        canonicalAssets: resolverOutput.assets,
        generatedImages: [],
        receipt: policy.provenance.attachToReceipt ? buildReceipt(
            context.runId,
            policy,
            snapshot.version,
            resolverOutput.assets,
            [],
            { estimate: 0, actual: 0 },
            { templateId: context.template.templateId }
        ) : undefined,
    };
}

/**
 * Execute prefer-canonical mode.
 * Tries canonical first, falls back to generation if allowed.
 */
async function executePreferCanonical(
    policy: ImagePolicy,
    context: ExecutionContext,
    snapshot: RegistrySnapshot
): Promise<PolicyResult> {
    const resolverOutput = resolveAssets(
        policy,
        context.template,
        snapshot.assets,
        snapshot.version
    );
    
    // If assets found, use them
    if (resolverOutput.assets.length > 0) {
        return {
            success: true,
            canonicalAssets: resolverOutput.assets,
            generatedImages: [],
            receipt: policy.provenance.attachToReceipt ? buildReceipt(
                context.runId,
                policy,
                snapshot.version,
                resolverOutput.assets,
                [],
                { estimate: 0, actual: 0 },
                { templateId: context.template.templateId }
            ) : undefined,
        };
    }
    
    // No assets found - try generation if allowed
    if (!canGenerate(policy)) {
        // Generation not enabled, behave like canonical-only
        const error = new NoCanonicalMatchError(
            resolverOutput.unmetConstraints,
            resolverOutput.reason
        );
        
        return {
            success: false,
            canonicalAssets: [],
            generatedImages: [],
            errorCode: error.code,
            errorDetails: {
                message: error.message,
                unmetConstraints: resolverOutput.unmetConstraints,
                nextAction: 'Enable generation or relax selection constraints',
            },
        };
    }
    
    // Check generation gate
    const gateContext: GenerationGateContext = {
        availableCredits: context.availableCredits,
        hasConsent: context.hasConsent,
    };
    
    const gateResult = checkGenerationGate(policy, gateContext);
    
    if (!gateResult.allowed) {
        return {
            success: false,
            canonicalAssets: [],
            generatedImages: [],
            errorCode: gateResult.error?.code ?? 'generation_failed',
            errorDetails: {
                message: gateResult.reason,
                nextAction: gateResult.error?.details.nextAction,
            },
        };
    }
    
    // Generate image
    const generated = await generateImages(policy, context, gateResult.estimatedCost ?? 0);
    
    return {
        success: true,
        canonicalAssets: [],
        generatedImages: generated,
        receipt: policy.provenance.attachToReceipt ? buildReceipt(
            context.runId,
            policy,
            snapshot.version,
            [],
            generated,
            { estimate: gateResult.estimatedCost ?? 0, actual: gateResult.estimatedCost ?? 0 },
            { templateId: context.template.templateId }
        ) : undefined,
    };
}

/**
 * Execute generate-ok mode.
 * May generate immediately, but should try canonical first unless maxAssets is 0.
 */
async function executeGenerateOk(
    policy: ImagePolicy,
    context: ExecutionContext,
    snapshot: RegistrySnapshot
): Promise<PolicyResult> {
    const canonicalAssets: SelectedAsset[] = [];
    const generatedImages: GeneratedImage[] = [];
    let creditEstimate = 0;
    let creditActual = 0;
    
    // Try canonical first unless explicitly skipped
    if (policy.selection.maxAssets > 0) {
        const resolverOutput = resolveAssets(
            policy,
            context.template,
            snapshot.assets,
            snapshot.version
        );
        canonicalAssets.push(...resolverOutput.assets);
    }
    
    // If need more images and generation allowed
    const neededCount = policy.selection.maxAssets - canonicalAssets.length;
    
    if (neededCount > 0 && canGenerate(policy)) {
        const gateContext: GenerationGateContext = {
            availableCredits: context.availableCredits,
            hasConsent: context.hasConsent,
            imageCount: Math.min(neededCount, policy.generation.maxGenerations),
        };
        
        const gateResult = checkGenerationGate(policy, gateContext);
        
        if (gateResult.allowed) {
            creditEstimate = gateResult.estimatedCost ?? 0;
            const generated = await generateImages(policy, context, creditEstimate);
            generatedImages.push(...generated);
            creditActual = creditEstimate;
        }
    }
    
    return {
        success: canonicalAssets.length > 0 || generatedImages.length > 0,
        canonicalAssets,
        generatedImages,
        receipt: policy.provenance.attachToReceipt ? buildReceipt(
            context.runId,
            policy,
            snapshot.version,
            canonicalAssets,
            generatedImages,
            { estimate: creditEstimate, actual: creditActual },
            { templateId: context.template.templateId }
        ) : undefined,
    };
}

// =============================================================================
// GENERATION HELPER
// =============================================================================

/**
 * Generate images using the provided generator function.
 * Returns placeholder if no generator is provided.
 */
async function generateImages(
    policy: ImagePolicy,
    context: ExecutionContext,
    _estimatedCost: number
): Promise<GeneratedImage[]> {
    if (!context.generateImage) {
        // No generator provided - return placeholder
        console.warn('No generateImage function provided, returning placeholder');
        return [{
            source: 'generated',
            provider: 'placeholder',
            model: 'placeholder',
            promptHash: 'placeholder',
            createdAt: new Date().toISOString(),
            output: {
                url: 'https://placeholder.example.com/generated.png',
                width: policy.generation.output.width,
                height: policy.generation.output.height,
                format: policy.generation.output.format,
                transparentBackground: policy.generation.output.transparentBackground,
            },
            reason: 'Placeholder - no generator function provided',
        }];
    }
    
    // Call the actual generator
    const generated = await context.generateImage(
        context.generationPrompt ?? 'Generate an image',
        {
            width: policy.generation.output.width,
            height: policy.generation.output.height,
            format: policy.generation.output.format,
            transparentBackground: policy.generation.output.transparentBackground,
        }
    );
    
    return [generated];
}

// =============================================================================
// MAIN EXECUTOR
// =============================================================================

/**
 * Execute an image policy.
 * This is the main entry point for policy execution.
 */
export async function executeImagePolicy(
    policy: ImagePolicy,
    context: ExecutionContext
): Promise<PolicyResult> {
    // Validate and normalize policy
    const validatedPolicy = ensurePolicy(policy, context.template.templateId);
    
    // Load registry snapshot
    const snapshot = await loadSnapshot(
        validatedPolicy.registrySnapshot,
        context.template.pinnedRegistryVersion
    );
    
    // Execute based on mode
    try {
        switch (validatedPolicy.mode) {
            case 'canonical-only':
                return await executeCanonicalOnly(validatedPolicy, context, snapshot);
                
            case 'prefer-canonical':
                return await executePreferCanonical(validatedPolicy, context, snapshot);
                
            case 'generate-ok':
                return await executeGenerateOk(validatedPolicy, context, snapshot);
                
            default:
                throw new Error(`Unknown policy mode: ${validatedPolicy.mode}`);
        }
    } catch (error) {
        if (isImagePolicyError(error)) {
            return {
                success: false,
                canonicalAssets: [],
                generatedImages: [],
                errorCode: error.code,
                errorDetails: {
                    message: error.message,
                    unmetConstraints: error.details.unmetConstraints,
                    nextAction: error.details.nextAction,
                },
            };
        }
        
        throw error;
    }
}
