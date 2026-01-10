/**
 * src/lib/image-policy/errors.ts
 * 
 * Stable error shapes for ImagePolicy (Section 10 of spec).
 * Each error includes a short message and details with unmet constraints and next action.
 */

// =============================================================================
// BASE ERROR
// =============================================================================

/**
 * Details included with every ImagePolicy error.
 */
export interface ImagePolicyErrorDetails {
    /** Constraints that could not be satisfied */
    unmetConstraints?: string[];
    
    /** Suggested next action */
    nextAction?: string;
    
    /** Additional context */
    [key: string]: unknown;
}

/**
 * Base class for all ImagePolicy errors.
 */
export abstract class ImagePolicyError extends Error {
    abstract readonly code: string;
    readonly details: ImagePolicyErrorDetails;
    
    constructor(message: string, details: ImagePolicyErrorDetails = {}) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        
        // Maintain proper stack trace (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    
    /**
     * Serialize to plain object for logging/receipts.
     */
    toJSON(): { code: string; message: string; details: ImagePolicyErrorDetails } {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}

// =============================================================================
// SPECIFIC ERRORS
// =============================================================================

/**
 * Thrown when a template or workflow does not declare an imagePolicy.
 */
export class PolicyMissingError extends ImagePolicyError {
    readonly code = 'policy_missing';
    
    constructor(templateId?: string) {
        super(
            `ImagePolicy is required but not declared${templateId ? ` for template: ${templateId}` : ''}`,
            {
                nextAction: 'Add an imagePolicy declaration to your template or workflow',
            }
        );
    }
}

/**
 * Thrown when canonical-only or prefer-canonical mode finds no matching assets.
 */
export class NoCanonicalMatchError extends ImagePolicyError {
    readonly code = 'no_canonical_match';
    
    constructor(unmetConstraints: string[], reason: string) {
        super(
            `No canonical assets match the selection constraints: ${reason}`,
            {
                unmetConstraints,
                nextAction: 'Relax selection constraints or switch to generate-ok mode',
            }
        );
    }
}

/**
 * Thrown when generation is requested but not enabled in policy.
 */
export class GenerationDisabledError extends ImagePolicyError {
    readonly code = 'generation_disabled';
    
    constructor(mode: string) {
        super(
            `Image generation is disabled in policy mode: ${mode}`,
            {
                nextAction: 'Set generation.enabled to true and use prefer-canonical or generate-ok mode',
            }
        );
    }
}

/**
 * Thrown when generation requires consent that hasn't been given.
 */
export class GenerationConsentRequiredError extends ImagePolicyError {
    readonly code = 'generation_consent_required';
    
    constructor() {
        super(
            'User consent is required before generating images',
            {
                nextAction: 'Prompt user to consent to image generation costs',
            }
        );
    }
}

/**
 * Thrown when generation would exceed the budget limit.
 */
export class GenerationBudgetExceededError extends ImagePolicyError {
    readonly code = 'generation_budget_exceeded';
    
    constructor(requested: number, available: number, maxCredits: number) {
        super(
            `Generation would exceed budget: requested ${requested} credits, ` +
            `available ${available} credits (max: ${maxCredits})`,
            {
                nextAction: 'Increase budget.maxCredits or reduce generation count',
                requested,
                available,
                maxCredits,
            }
        );
    }
}

/**
 * Thrown when attempting to promote a generated image but promotion is not allowed.
 */
export class PromotionNotAllowedError extends ImagePolicyError {
    readonly code = 'promotion_not_allowed';
    
    constructor() {
        super(
            'Promotion of generated images to canonical registry is not allowed',
            {
                nextAction: 'Set promotion.allowPromotion to true in the policy',
            }
        );
    }
}

/**
 * Thrown when promoting but required metadata fields are missing.
 */
export class PromotionMissingFieldsError extends ImagePolicyError {
    readonly code = 'promotion_missing_fields';
    
    constructor(missingFields: string[]) {
        super(
            `Required metadata fields missing for promotion: ${missingFields.join(', ')}`,
            {
                unmetConstraints: missingFields,
                nextAction: 'Provide all required fields: purpose, product, variant, tags',
            }
        );
    }
}

// =============================================================================
// ERROR TYPE GUARD
// =============================================================================

/**
 * Type guard to check if an error is an ImagePolicyError.
 */
export function isImagePolicyError(error: unknown): error is ImagePolicyError {
    return error instanceof ImagePolicyError;
}

/**
 * Get error code from any error (uses 'unknown' for non-policy errors).
 */
export function getErrorCode(error: unknown): string {
    if (isImagePolicyError(error)) {
        return error.code;
    }
    return 'unknown';
}
