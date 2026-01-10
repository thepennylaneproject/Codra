/**
 * src/lib/image-policy/receipt-builder.ts
 * 
 * Creates execution receipts for observability (Section 9 of spec).
 */

import type {
    ImagePolicy,
    PolicyReceipt,
    SelectedAsset,
    GeneratedImage,
} from './types';

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a unique receipt ID.
 */
function generateReceiptId(): string {
    return `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// RECEIPT BUILDER
// =============================================================================

/**
 * Build a policy execution receipt.
 */
export function buildReceipt(
    runId: string,
    policy: ImagePolicy,
    registryVersion: string | number,
    canonicalAssets: SelectedAsset[],
    generatedOutputs: GeneratedImage[],
    credits: { estimate: number; actual: number },
    options?: {
        templateId?: string;
        workflowId?: string;
    }
): PolicyReceipt {
    return {
        id: generateReceiptId(),
        runId,
        templateId: options?.templateId,
        workflowId: options?.workflowId,
        policy,
        registryVersion,
        canonicalAssets,
        generatedOutputs,
        creditEstimate: credits.estimate,
        creditActual: credits.actual,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Build a minimal receipt (when provenance.attachToReceipt is false).
 */
export function buildMinimalReceipt(
    runId: string,
    registryVersion: string | number
): Partial<PolicyReceipt> {
    return {
        id: generateReceiptId(),
        runId,
        registryVersion,
        createdAt: new Date().toISOString(),
    };
}

// =============================================================================
// RECEIPT SERIALIZATION
// =============================================================================

/**
 * Serialize a receipt to JSON for storage/logging.
 */
export function serializeReceipt(receipt: PolicyReceipt): string {
    return JSON.stringify(receipt, null, 2);
}

/**
 * Create a summary string for logging.
 */
export function summarizeReceipt(receipt: PolicyReceipt): string {
    const parts: string[] = [
        `Receipt ${receipt.id}`,
        `run=${receipt.runId}`,
        `canonical=${receipt.canonicalAssets.length}`,
        `generated=${receipt.generatedOutputs.length}`,
        `credits=${receipt.creditActual}`,
    ];
    
    if (receipt.templateId) {
        parts.push(`template=${receipt.templateId}`);
    }
    
    return parts.join(' | ');
}
