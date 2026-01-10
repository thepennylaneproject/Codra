/**
 * src/lib/image-policy/promotion.ts
 * 
 * Promotion workflow for generated images to canonical registry (Section 8 of spec).
 * Promotion is NEVER automatic - requires explicit action and human approval.
 */

import type { ImagePolicy, GeneratedImage, CanonicalAsset } from './types';
import { PromotionNotAllowedError, PromotionMissingFieldsError } from './errors';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Metadata required for promotion.
 */
export interface PromotionMetadata {
    role: string;
    productFamily: string;
    variant: string;
    tags: string[];
    notes?: string;
}

/**
 * Result from a promotion attempt.
 */
export interface PromotionResult {
    success: boolean;
    promotedAsset?: CanonicalAsset;
    newRegistryVersion?: number;
    error?: string;
}

/**
 * Pending promotion request.
 */
export interface PromotionRequest {
    id: string;
    generatedImage: GeneratedImage;
    metadata: PromotionMetadata;
    requestedBy: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if promotion is allowed by the policy.
 */
export function canPromote(policy: ImagePolicy): boolean {
    return policy.promotion.allowPromotion;
}

/**
 * Validate that all required metadata fields are present.
 */
export function validatePromotionMetadata(
    policy: ImagePolicy,
    metadata: Partial<PromotionMetadata>
): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of policy.promotion.requiredFields) {
        if (field === 'tags') {
            if (!metadata.tags || metadata.tags.length === 0) {
                missingFields.push('tags');
            }
        } else if (!metadata[field as keyof PromotionMetadata]) {
            missingFields.push(field);
        }
    }
    
    return {
        valid: missingFields.length === 0,
        missingFields,
    };
}

// =============================================================================
// PROMOTION WORKFLOW
// =============================================================================

/**
 * Request promotion of a generated image.
 * Creates a pending request that requires human approval.
 */
export function requestPromotion(
    policy: ImagePolicy,
    generatedImage: GeneratedImage,
    metadata: PromotionMetadata,
    requestedBy: string
): PromotionRequest {
    // Check if promotion is allowed
    if (!canPromote(policy)) {
        throw new PromotionNotAllowedError();
    }
    
    // Validate metadata
    const validation = validatePromotionMetadata(policy, metadata);
    if (!validation.valid) {
        throw new PromotionMissingFieldsError(validation.missingFields);
    }
    
    // Create pending request
    return {
        id: `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedImage,
        metadata,
        requestedBy,
        requestedAt: new Date().toISOString(),
        status: 'pending',
    };
}

/**
 * Approve a promotion request.
 * In production, this would:
 * 1. Re-process the image through the enrichment pipeline
 * 2. Add to canonical registry
 * 3. Create a new registry version
 * 4. Store provenance (origin: generated)
 */
export async function approvePromotion(
    request: PromotionRequest,
    reviewedBy: string,
    reviewNotes?: string
): Promise<PromotionResult> {
    if (request.status !== 'pending') {
        return {
            success: false,
            error: `Request is already ${request.status}`,
        };
    }
    
    // Update request status
    request.status = 'approved';
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date().toISOString();
    request.reviewNotes = reviewNotes;
    
    // TODO: In production, implement:
    // 1. Re-enrich the image with Cloudinary
    // 2. Insert into canonical registry (assets table or JSON)
    // 3. Create new registry version
    // 4. Store provenance metadata
    
    // For now, return a placeholder result
    const promotedAsset: CanonicalAsset = {
        assetId: `promoted-${request.id}`,
        cloudinaryPublicId: `promoted/${request.id}`,
        cloudinaryUrl: request.generatedImage.output.url,
        tags: request.metadata.tags,
        role: request.metadata.role as any,
        energy: 'medium',
        lifecycleStatus: 'approved',
        assetClass: 'raster',
        aspectClass: 'unknown',
        sizeClass: 'unknown',
        format: request.generatedImage.output.format,
        width: request.generatedImage.output.width,
        height: request.generatedImage.output.height,
        bytes: 0,
        productFamily: request.metadata.productFamily as any,
        variant: request.metadata.variant as any,
        createdAt: new Date().toISOString(),
    };
    
    return {
        success: true,
        promotedAsset,
        newRegistryVersion: 1, // Placeholder
    };
}

/**
 * Reject a promotion request.
 */
export function rejectPromotion(
    request: PromotionRequest,
    reviewedBy: string,
    reviewNotes: string
): PromotionRequest {
    if (request.status !== 'pending') {
        throw new Error(`Request is already ${request.status}`);
    }
    
    request.status = 'rejected';
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date().toISOString();
    request.reviewNotes = reviewNotes;
    
    return request;
}
