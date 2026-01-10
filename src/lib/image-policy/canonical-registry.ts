/**
 * src/lib/image-policy/canonical-registry.ts
 * 
 * Loads canonical assets from the enriched JSON registry.
 * Supports pinned (versioned) and latest snapshot modes.
 */

import type { CanonicalAsset, RegistrySnapshotMode } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Registry snapshot with version info.
 */
export interface RegistrySnapshot {
    version: number | 'latest';
    assets: CanonicalAsset[];
    loadedAt: Date;
}

// =============================================================================
// CACHE
// =============================================================================

// In-memory cache for snapshots
const snapshotCache = new Map<string, RegistrySnapshot>();

// Current "latest" assets (loaded from enriched JSON)
let latestAssets: CanonicalAsset[] | null = null;
let latestVersion = 0;

// =============================================================================
// LOADER
// =============================================================================

/**
 * Load the latest canonical assets from the enriched JSON.
 * In production, this would fetch from Supabase or a CDN.
 */
async function loadLatestAssets(): Promise<CanonicalAsset[]> {
    if (latestAssets !== null) {
        return latestAssets;
    }
    
    // Try to load from the enriched JSON file
    // In browser, this would be a fetch; in Node, a file read
    try {
        // Dynamic import for the enriched assets
        // This path is relative to the build output
        const assetsModule = await import('../../../out/assets-index-enriched.json');
        const rawAssets = assetsModule.default || assetsModule;
        
        // Map to CanonicalAsset shape
        latestAssets = rawAssets.map((asset: Record<string, unknown>) => ({
            assetId: asset.assetId as string,
            cloudinaryPublicId: asset.cloudinaryPublicId as string,
            cloudinaryUrl: asset.cloudinaryUrl as string,
            tags: (asset.tags as string[]) || [],
            role: (asset.role as string) || 'other',
            energy: (asset.energy as string) || 'low',
            lifecycleStatus: (asset.lifecycleStatus as string) || 'approved',
            productFamily: (asset.productFamily as string) || 'relevnt_core',
            assetClass: (asset.assetClass as any) || (asset.format === 'svg' ? 'vector' : 'raster'),
            vectorType: asset.vectorType as any,
            isInvertible: asset.isInvertible as boolean,
            isThemable: asset.isThemable as boolean,
            complexity: asset.complexity as any,
            aspectClass: (asset.aspectClass as string) || 'unknown',
            sizeClass: (asset.sizeClass as string) || 'unknown',
            format: (asset.format as string) || 'unknown',
            width: (asset.width as number) || 0,
            height: (asset.height as number) || 0,
            bytes: (asset.bytes as number) || 0,
            variant: asset.variant as string | undefined,
            transparent: asset.transparent as boolean | null | undefined,
            createdAt: (asset.createdAt as string) || new Date().toISOString(),
        })) as CanonicalAsset[];
        
        latestVersion++;
        
        return latestAssets;
    } catch (error) {
        console.warn('Could not load enriched assets JSON, returning empty registry', error);
        latestAssets = [];
        return latestAssets;
    }
}

/**
 * Load a pinned snapshot by version number.
 * In production, this would fetch from Supabase image_policy_registry_versions table.
 */
async function loadPinnedSnapshot(version: number): Promise<CanonicalAsset[]> {
    const cacheKey = `pinned-${version}`;
    
    const cached = snapshotCache.get(cacheKey);
    if (cached) {
        return cached.assets;
    }
    
    // TODO: In production, fetch from Supabase:
    // const { data } = await supabase
    //     .from('image_policy_registry_versions')
    //     .select('snapshot_json')
    //     .eq('version', version)
    //     .single();
    
    // For now, fall back to latest
    console.warn(`Pinned version ${version} not found, falling back to latest`);
    const assets = await loadLatestAssets();
    
    snapshotCache.set(cacheKey, {
        version,
        assets,
        loadedAt: new Date(),
    });
    
    return assets;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Load a registry snapshot based on the mode and optional version.
 */
export async function loadSnapshot(
    mode: RegistrySnapshotMode,
    pinnedVersion?: number
): Promise<RegistrySnapshot> {
    if (mode === 'pinned' && pinnedVersion !== undefined) {
        const assets = await loadPinnedSnapshot(pinnedVersion);
        return {
            version: pinnedVersion,
            assets,
            loadedAt: new Date(),
        };
    }
    
    // Latest mode
    const assets = await loadLatestAssets();
    return {
        version: 'latest',
        assets,
        loadedAt: new Date(),
    };
}

/**
 * Get the current latest version number.
 */
export function getCurrentVersion(): number {
    return latestVersion;
}

/**
 * Clear all cached snapshots.
 */
export function clearCache(): void {
    snapshotCache.clear();
    latestAssets = null;
    latestVersion = 0;
}

/**
 * Get registry stats.
 */
export async function getRegistryStats(): Promise<{
    totalAssets: number;
    byFormat: Record<string, number>;
    byRole: Record<string, number>;
    bySizeClass: Record<string, number>;
}> {
    const assets = await loadLatestAssets();
    
    const byFormat: Record<string, number> = {};
    const byRole: Record<string, number> = {};
    const bySizeClass: Record<string, number> = {};
    
    for (const asset of assets) {
        byFormat[asset.format] = (byFormat[asset.format] || 0) + 1;
        byRole[asset.role] = (byRole[asset.role] || 0) + 1;
        bySizeClass[asset.sizeClass] = (bySizeClass[asset.sizeClass] || 0) + 1;
    }
    
    return {
        totalAssets: assets.length,
        byFormat,
        byRole,
        bySizeClass,
    };
}
