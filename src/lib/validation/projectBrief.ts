/**
 * Project Context Validation
 * 
 * Validates required fields in the project context/brief form
 * to ensure users don't skip critical project setup fields.
 */

export interface ProjectContextFormState {
    audience: {
        primary: string;
        context?: {
            segment?: string;
            sophistication?: string;
        };
    };
    brand: {
        voiceGuidelines?: string;
        colors?: {
            primary?: string;
            secondary?: string;
            accent?: string;
        };
    };
    success: {
        definitionOfDone?: string[];
    };
    guardrails: {
        mustAvoid?: string[];
        competitors?: string[];
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validates the project context form data for required fields.
 * 
 * Required fields:
 * - Target Audience (audience.primary)
 * - Brand Constraints (brand.voiceGuidelines)
 * - Success Criteria (success.definitionOfDone with at least one item)
 * - Guardrails (guardrails.mustAvoid with at least one item)
 */
export function validateProjectContext(data: ProjectContextFormState): ValidationResult {
    const errors: Record<string, string> = {};

    // Check Target Audience
    const audiencePrimary = data.audience?.primary?.trim() || '';
    if (!audiencePrimary || audiencePrimary.toLowerCase() === 'self' || audiencePrimary === 'N/A') {
        errors.audience = 'Please specify your target audience';
    }

    // Check Brand Constraints (Voice & Tone)
    const voiceGuidelines = data.brand?.voiceGuidelines?.trim() || '';
    if (!voiceGuidelines || voiceGuidelines === 'N/A') {
        errors.brand = 'Please define your brand voice and tone';
    }

    // Check Success Criteria (Definition of Done)
    const definitionOfDone = data.success?.definitionOfDone || [];
    const validCriteria = definitionOfDone.filter(item => item?.trim());
    if (validCriteria.length === 0) {
        errors.success = 'Please define at least one success criterion';
    }

    // Check Guardrails (Must Avoid)
    const mustAvoid = data.guardrails?.mustAvoid || [];
    const validGuardrails = mustAvoid.filter(item => item?.trim());
    if (validGuardrails.length === 0) {
        errors.guardrails = 'Please add at least one guardrail or constraint';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Gets a summary message for validation errors
 */
export function getValidationSummary(errors: Record<string, string>): string {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 0) return '';
    
    const fieldNames = Object.keys(errors).map(key => {
        switch (key) {
            case 'audience': return 'Target Audience';
            case 'brand': return 'Brand Constraints';
            case 'success': return 'Success Criteria';
            case 'guardrails': return 'Guardrails';
            default: return key;
        }
    });

    if (errorCount === 1) {
        return `Please complete the ${fieldNames[0]} section before continuing.`;
    }

    return `Please complete the following sections: ${fieldNames.join(', ')}.`;
}
