/**
 * src/lib/image-policy/resolver.ts
 * 
 * Deterministic asset resolver (Section 5 of spec).
 * Pure function that selects canonical assets based on policy constraints.
 */

import type {
    ImagePolicy,
    CanonicalAsset,
    SelectionConstraints,
    SelectedAsset,
    ResolverOutput,
    TemplateMetadata,
} from './types';

// =============================================================================
// MATCHING FUNCTIONS
// =============================================================================

/**
 * Check if an asset matches a single constraint value.
 * 'any' means no filtering.
 */
function matchesConstraint(value: string | undefined, constraint: string): boolean {
    if (constraint === 'any') return true;
    if (value === undefined || value === 'unknown' || value === '') return constraint === 'any';
    return value.toLowerCase() === constraint.toLowerCase();
}

/**
 * Check if a boolean asset field matches a constraint.
 */
function matchesBooleanConstraint(value: boolean | null | undefined, constraint: 'any' | 'true' | 'false'): boolean {
    if (constraint === 'any') return true;
    const boolConstraint = constraint === 'true';
    return !!value === boolConstraint;
}

/**
 * Check if an asset has all required tags.
 */
function hasRequiredTags(asset: CanonicalAsset, requiredTags: string[]): boolean {
    if (requiredTags.length === 0) return true;
    const assetTags = new Set(asset.tags.map(t => t.toLowerCase()));
    return requiredTags.every(tag => assetTags.has(tag.toLowerCase()));
}

/**
 * Check if an asset has any forbidden tags.
 */
function hasForbiddenTags(asset: CanonicalAsset, forbiddenTags: string[]): boolean {
    if (forbiddenTags.length === 0) return false;
    const assetTags = new Set(asset.tags.map(t => t.toLowerCase()));
    return forbiddenTags.some(tag => assetTags.has(tag.toLowerCase()));
}

/**
 * Check if an asset meets dimension requirements.
 */
function meetsDimensions(
    asset: CanonicalAsset,
    minWidth: number,
    minHeight: number
): boolean {
    return asset.width >= minWidth && asset.height >= minHeight;
}

/**
 * Check if an asset's format is allowed.
 */
function isFormatAllowed(asset: CanonicalAsset, allowedFormats: string[]): boolean {
    if (allowedFormats.length === 0) return true;
    return allowedFormats.some(f => f.toLowerCase() === asset.format.toLowerCase());
}

// =============================================================================
// FILTERING
// =============================================================================

/**
 * Filter assets by selection constraints.
 * Returns assets that match ALL constraints.
 */
export function filterAssets(
    assets: CanonicalAsset[],
    constraints: SelectionConstraints
): { matched: CanonicalAsset[]; unmetConstraints: string[] } {
    const unmetConstraints: string[] = [];
    
    let filtered = assets;
    
    // Role filter
    const beforeRole = filtered.length;
    filtered = filtered.filter(a => matchesConstraint(a.role, constraints.role));
    if (filtered.length === 0 && beforeRole > 0) {
        unmetConstraints.push(`role: no assets match ${constraints.role}`);
    }

    // Energy filter
    const beforeEnergy = filtered.length;
    filtered = filtered.filter(a => matchesConstraint(a.energy, constraints.energy));
    if (filtered.length === 0 && beforeEnergy > 0) {
        unmetConstraints.push(`energy: no assets match ${constraints.energy}`);
    }

    // Lifecycle Status filter
    const beforeLifecycle = filtered.length;
    filtered = filtered.filter(a => matchesConstraint(a.lifecycleStatus, constraints.lifecycleStatus));
    if (filtered.length === 0 && beforeLifecycle > 0) {
        unmetConstraints.push(`lifecycleStatus: no assets match ${constraints.lifecycleStatus}`);
    }

    // Transparency filter
    const beforeTrans = filtered.length;
    filtered = filtered.filter(a => matchesBooleanConstraint(a.transparent, constraints.transparent));
    if (filtered.length === 0 && beforeTrans > 0) {
        unmetConstraints.push(`transparent: no assets match ${constraints.transparent}`);
    }
    
    // Variant filter
    const beforeVariant = filtered.length;
    filtered = filtered.filter(a => matchesConstraint(a.variant, constraints.variant));
    if (filtered.length === 0 && beforeVariant > 0) {
        unmetConstraints.push(`variant: no assets match ${constraints.variant}`);
    }

    // Asset Class filter (Crucial bifurcation)
    const beforeClass = filtered.length;
    filtered = filtered.filter(a => matchesConstraint(a.assetClass, constraints.assetClass));
    if (filtered.length === 0 && beforeClass > 0) {
        unmetConstraints.push(`assetClass: no assets match ${constraints.assetClass}`);
    }

    // Lane-specific logic
    if (constraints.assetClass === 'vector') {
        // Vectors: Ignore resolution, enforce vector-specifics
        if (constraints.vectorType && constraints.vectorType !== 'mixed') {
            filtered = filtered.filter(a => matchesConstraint(a.vectorType, constraints.vectorType!));
        }
        if (constraints.complexity) {
            filtered = filtered.filter(a => matchesConstraint(a.complexity, constraints.complexity!));
        }
        if (constraints.isInvertible !== undefined) {
            filtered = filtered.filter(a => a.isInvertible === constraints.isInvertible);
        }
        if (constraints.isThemable !== undefined) {
            filtered = filtered.filter(a => a.isThemable === constraints.isThemable);
        }
    } else {
        // Rasters: Apply resolution/format/size filters
        filtered = filtered.filter(a => isFormatAllowed(a, constraints.allowedFormats));
        filtered = filtered.filter(a => meetsDimensions(a, constraints.minWidth, constraints.minHeight));
        filtered = filtered.filter(a => matchesConstraint(a.sizeClass, constraints.sizeClass));
    }
    
    // Required tags filter
    const beforeReq = filtered.length;
    filtered = filtered.filter(a => hasRequiredTags(a, constraints.requiredTags));
    if (filtered.length === 0 && beforeReq > 0) {
        unmetConstraints.push(`requiredTags: no assets have all of ${constraints.requiredTags.join(', ')}`);
    }
    
    // Forbidden tags filter
    const beforeForbid = filtered.length;
    filtered = filtered.filter(a => !hasForbiddenTags(a, constraints.forbiddenTags));
    if (filtered.length === 0 && beforeForbid > 0) {
        unmetConstraints.push(`forbiddenTags: all assets have one of ${constraints.forbiddenTags.join(', ')}`);
    }
    
    return { matched: filtered, unmetConstraints };
}

// =============================================================================
// RANKING
// =============================================================================

/**
 * Deterministic tie-breaker ranking.
 * Order: largest resolution → closest to square → most tag overlap → newest
 */
export function rankAssets(
    assets: CanonicalAsset[],
    _metadata?: TemplateMetadata
): CanonicalAsset[] {
    return [...assets].sort((a, b) => {
        // 0. Class-based priority (prefer class consistency, though filter handles this)
        if (a.assetClass !== b.assetClass) return 0;

        if (a.assetClass === 'vector') {
            // Vector Ranking: Tag density → Newest
            if (a.tags.length !== b.tags.length) return b.tags.length - a.tags.length;
        } else {
            // Raster Ranking: resolution → closeness to square → tags
            const resA = a.width * a.height;
            const resB = b.width * b.height;
            if (resA !== resB) return resB - resA;
            
            const aspectA = a.width / a.height;
            const aspectB = b.width / b.height;
            const squarenessA = Math.abs(1 - aspectA);
            const squarenessB = Math.abs(1 - aspectB);
            if (squarenessA !== squarenessB) return squarenessA - squarenessB;

            if (a.tags.length !== b.tags.length) return b.tags.length - a.tags.length;
        }
        
        // Final tie-breaker: Newest first → assetId
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (dateA !== dateB) return dateB - dateA;
        
        return a.assetId.localeCompare(b.assetId);
    });
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Remove visually similar assets (same dimensions + similar file size).
 */
export function dedupeAssets(assets: CanonicalAsset[]): CanonicalAsset[] {
    const seen = new Map<string, CanonicalAsset>();
    
    for (const asset of assets) {
        // Create a dedup key based on dimensions and approximate size
        const sizeClass = Math.floor(asset.bytes / 10000); // 10KB buckets
        const key = `${asset.width}x${asset.height}-${sizeClass}-${asset.format}`;
        
        if (!seen.has(key)) {
            seen.set(key, asset);
        }
    }
    
    return Array.from(seen.values());
}

// =============================================================================
// REASON GENERATION
// =============================================================================

/**
 * Generate human-readable selection reason.
 */
function generateReason(
    selected: CanonicalAsset[],
    total: number,
    constraints: SelectionConstraints
): string {
    if (selected.length === 0) {
        return `No assets matched the constraints out of ${total} candidates`;
    }
    
    const parts: string[] = [];
    parts.push(`Selected ${selected.length} asset(s) from ${total} candidates`);
    
    // Mention key constraints that were applied
    if (constraints.role !== 'any') {
        parts.push(`role: ${constraints.role}`);
    }
    if (constraints.energy !== 'any') {
        parts.push(`energy: ${constraints.energy}`);
    }
    if (constraints.aspect !== 'any') {
        parts.push(`aspect: ${constraints.aspect}`);
    }
    if (constraints.productFamily !== 'any') {
        parts.push(`family: ${constraints.productFamily}`);
    }
    if (constraints.assetClass !== 'raster') {
        parts.push(`class: ${constraints.assetClass}`);
    }
    
    return parts.join('; ');
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve assets from the canonical registry.
 * This is a PURE FUNCTION - deterministic given the same inputs.
 */
export function resolveAssets(
    policy: ImagePolicy,
    metadata: TemplateMetadata,
    registry: CanonicalAsset[],
    registryVersion: string | number
): ResolverOutput {
    const { selection } = policy;
    
    // If maxAssets is 0, skip canonical selection entirely
    if (selection.maxAssets === 0) {
        return {
            assets: [],
            reason: 'maxAssets is 0, skipping canonical selection',
            registryVersion,
            unmetConstraints: [],
        };
    }
    
    // 1. Filter by constraints
    const { matched, unmetConstraints } = filterAssets(registry, selection);
    
    // 2. Dedupe if requested
    let candidates = selection.dedupe ? dedupeAssets(matched) : matched;
    
    // 3. Rank deterministically
    candidates = rankAssets(candidates, metadata);
    
    // 4. Limit to maxAssets
    const selected = candidates.slice(0, selection.maxAssets);
    
    // 5. Convert to SelectedAsset format
    const assets: SelectedAsset[] = selected.map((asset, index) => ({
        source: 'canonical' as const,
        assetId: asset.assetId,
        cloudinaryPublicId: asset.cloudinaryPublicId,
        url: asset.cloudinaryUrl,
        reason: `Rank #${index + 1}: [${asset.assetClass}] ${asset.width}x${asset.height} ${asset.format}, ` +
                `${asset.tags.length} tags, role: ${asset.role}, energy: ${asset.energy}` +
                (asset.assetClass === 'vector' ? `, type: ${asset.vectorType}` : ''),
    }));
    
    // 6. Generate overall reason
    const reason = generateReason(selected, registry.length, selection);
    
    return {
        assets,
        reason,
        registryVersion,
        unmetConstraints: assets.length === 0 ? unmetConstraints : [],
    };
}
