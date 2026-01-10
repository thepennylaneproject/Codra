/**
 * src/lib/image-policy/generation-gate.ts
 * 
 * Controls when image generation is allowed based on policy, budget, and consent.
 */

import type { ImagePolicy } from './types';
import {
    GenerationDisabledError,
    GenerationConsentRequiredError,
    GenerationBudgetExceededError,
    type ImagePolicyError,
} from './errors';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result from checking the generation gate.
 */
export interface GenerationGateResult {
    /** Whether generation is allowed */
    allowed: boolean;
    
    /** Human-readable reason */
    reason: string;
    
    /** Error if not allowed */
    error?: ImagePolicyError;
    
    /** Estimated credit cost for generation */
    estimatedCost?: number;
}

/**
 * Context for checking the generation gate.
 */
export interface GenerationGateContext {
    /** User's available credits */
    availableCredits: number;
    
    /** Whether user has consented to generation */
    hasConsent: boolean;
    
    /** Number of images to generate */
    imageCount?: number;
}

// =============================================================================
// COST ESTIMATION
// =============================================================================

/**
 * Estimate the cost of generating images.
 * This is a simplified model - in production, would use actual provider pricing.
 */
export function estimateGenerationCost(
    policy: ImagePolicy,
    imageCount: number = 1
): number {
    const { output } = policy.generation;
    
    // Base cost per image (in credits)
    let baseCost = 1;
    
    // Dimension multiplier (larger = more expensive)
    const pixels = output.width * output.height;
    const megapixels = pixels / 1_000_000;
    baseCost *= Math.max(1, megapixels);
    
    // Transparency adds cost
    if (output.transparentBackground) {
        baseCost *= 1.5;
    }
    
    // Total for requested count
    return Math.ceil(baseCost * imageCount);
}

// =============================================================================
// GATE CHECK
// =============================================================================

/**
 * Check if generation is allowed given the policy and context.
 */
export function checkGenerationGate(
    policy: ImagePolicy,
    context: GenerationGateContext
): GenerationGateResult {
    const { generation, budget, mode } = policy;
    const imageCount = context.imageCount ?? generation.output.count;
    
    // 1. Check if generation is enabled
    if (!generation.enabled) {
        return {
            allowed: false,
            reason: `Generation is disabled in mode: ${mode}`,
            error: new GenerationDisabledError(mode),
        };
    }
    
    // 2. Check mode allows generation
    if (mode === 'canonical-only') {
        return {
            allowed: false,
            reason: 'canonical-only mode does not allow generation',
            error: new GenerationDisabledError(mode),
        };
    }
    
    // 3. Check consent if required
    if (budget.requireConsent && !context.hasConsent) {
        return {
            allowed: false,
            reason: 'User consent required for image generation',
            error: new GenerationConsentRequiredError(),
        };
    }
    
    // 4. Check budget if set
    const estimatedCost = estimateGenerationCost(policy, imageCount);
    
    if (budget.maxCredits !== null) {
        if (estimatedCost > budget.maxCredits) {
            return {
                allowed: false,
                reason: `Estimated cost ${estimatedCost} exceeds budget ${budget.maxCredits}`,
                error: new GenerationBudgetExceededError(
                    estimatedCost,
                    context.availableCredits,
                    budget.maxCredits
                ),
            };
        }
        
        if (estimatedCost > context.availableCredits) {
            return {
                allowed: false,
                reason: `Estimated cost ${estimatedCost} exceeds available credits ${context.availableCredits}`,
                error: new GenerationBudgetExceededError(
                    estimatedCost,
                    context.availableCredits,
                    budget.maxCredits
                ),
            };
        }
    }
    
    // 5. Check maxGenerations limit
    if (imageCount > generation.maxGenerations) {
        return {
            allowed: false,
            reason: `Requested ${imageCount} images exceeds maxGenerations ${generation.maxGenerations}`,
            error: new GenerationBudgetExceededError(
                imageCount,
                generation.maxGenerations,
                generation.maxGenerations
            ),
        };
    }
    
    // All checks passed
    return {
        allowed: true,
        reason: `Generation allowed: ${imageCount} image(s), estimated cost ${estimatedCost} credits`,
        estimatedCost,
    };
}

/**
 * Quick check if generation is even possible with this policy.
 * Does not check budget or consent.
 */
export function canGenerate(policy: ImagePolicy): boolean {
    return policy.generation.enabled && policy.mode !== 'canonical-only';
}
