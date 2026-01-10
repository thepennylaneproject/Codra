/**
 * src/utils/image-resolver.ts
 * 
 * High-level utility for template-safe image resolution.
 * Bridges the gap between template image slots and the ImagePolicy engine.
 */

import { 
    executeImagePolicy, 
    type ImagePolicy, 
    type PolicyResult,
    type ImageRole,
    type ProductFamily,
    type EnergyLevel,
    type AspectClass
} from '../lib/image-policy/types';
import { DEFAULT_IMAGE_POLICY, mergeWithDefaults } from '../lib/image-policy/defaults';

export interface ResolveOptions {
    role: ImageRole;
    productFamily?: ProductFamily;
    energy?: EnergyLevel;
    aspect?: AspectClass;
    transparent?: boolean;
    limit?: number;
    pinnedVersion?: number;
}

/**
 * Resolve an image by functional role and constraints.
 * 
 * @example
 * const { url } = await resolveImageByRole({ 
 *   role: 'background-soft', 
 *   productFamily: 'relevnt_core' 
 * });
 */
export async function resolveImageByRole(options: ResolveOptions): Promise<{ 
    url: string | null; 
    assetId: string | null;
    reason: string;
    success: boolean;
}> {
    const { 
        role, 
        productFamily = 'relevnt_core', 
        energy = 'any', 
        aspect = 'any',
        transparent = 'any',
        limit = 1,
        pinnedVersion 
    } = options;

    // 1. Build a specialized policy for this retrieval
    const policy: ImagePolicy = mergeWithDefaults({
        mode: 'canonical-only',
        registrySnapshot: pinnedVersion ? 'pinned' : 'latest',
        selection: {
            ...DEFAULT_IMAGE_POLICY.selection,
            maxAssets: limit,
            role,
            productFamily,
            energy,
            aspect,
            transparent: transparent === 'any' ? 'any' : (transparent ? 'true' : 'false'),
            lifecycleStatus: 'approved' // Always favor approved in production
        }
    });

    // 2. Execute policy
    const result: PolicyResult = await executeImagePolicy(policy, {
        runId: `res-${Date.now()}`,
        availableCredits: 0,
        hasConsent: false,
        template: {
            templateId: 'adhoc-resolver',
            pinnedRegistryVersion: pinnedVersion
        }
    });

    // 3. Return flattened result
    if (!result.success || result.canonicalAssets.length === 0) {
        return {
            url: null,
            assetId: null,
            reason: result.errorDetails?.message || 'No assets matched constraints',
            success: false
        };
    }

    const bestFit = result.canonicalAssets[0];
    return {
        url: bestFit.url,
        assetId: bestFit.assetId,
        reason: bestFit.reason,
        success: true
    };
}
