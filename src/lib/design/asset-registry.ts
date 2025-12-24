/**
 * BACKGROUND ASSET REGISTRY
 * 
 * Registry for background assets with naming conventions.
 * Assets are mediated by the Placement Autopatcher - never embedded directly in components.
 * 
 * Naming Convention:
 * {context}_background_{aspect_ratio}
 * 
 * Examples:
 * - dashboard_background_16_9
 * - dashboard_background_9_16
 * - editor_background_16_9
 * 
 * Formats (in priority order):
 * - WebP: Preferred for size efficiency
 * - PNG: Fallback for quality
 * - Master files: Suffixed with MASTER_MONO for hue-rotate theming
 */

// Import master assets
import masterMonoBg from '../../assets/atmosphere/dashboard_bg__cosmic_wave__v1__MASTER_MONO__16_9.png';
import accentGoldBg from '../../assets/atmosphere/dashboard_bg__cosmic_wave__v1__accent_gold__16_9.png';

export type AssetContext = 'dashboard' | 'editor' | 'landing' | 'modal' | 'onboarding';
export type AspectRatio = '16_9' | '9_16' | '4_3' | '1_1';

export interface BackgroundAsset {
    /** Unique identifier */
    id: string;
    /** Where this asset should be used */
    context: AssetContext;
    /** Aspect ratio for viewport matching */
    aspectRatio: AspectRatio;
    /** Path to the asset (can be import or URL) */
    path: string;
    /** Fallback path if primary fails */
    fallbackPath?: string;
    /** Whether this is a master monochrome asset (supports hue-rotate) */
    isMaster?: boolean;
    /** Whether this asset has motion variants */
    hasMotionVariant?: boolean;
    /** Alt text for accessibility (empty for decorative) */
    altText: string;
    /** File size in KB for performance budgeting */
    sizeKb?: number;
}

/**
 * Master registry of all background assets
 */
export const BACKGROUND_ASSETS: Record<string, BackgroundAsset> = {
    'dashboard-master': {
        id: 'dashboard-master',
        context: 'dashboard',
        aspectRatio: '16_9',
        path: masterMonoBg,
        isMaster: true,
        hasMotionVariant: true,
        altText: '', // Decorative
        sizeKb: 818,
    },
    'dashboard-gold': {
        id: 'dashboard-gold',
        context: 'dashboard',
        aspectRatio: '16_9',
        path: accentGoldBg,
        isMaster: false,
        altText: '', // Decorative
        sizeKb: 622,
    },
    // Placeholder entries for future assets
    'editor-master': {
        id: 'editor-master',
        context: 'editor',
        aspectRatio: '16_9',
        path: masterMonoBg, // Reuse for now
        isMaster: true,
        altText: '',
    },
    'modal-minimal': {
        id: 'modal-minimal',
        context: 'modal',
        aspectRatio: '16_9',
        path: masterMonoBg,
        isMaster: true,
        altText: '',
    },
};

/**
 * Context to asset mapping based on PlacementIntent
 */
export const CONTEXT_MAP: Record<string, AssetContext> = {
    'ambient': 'dashboard',
    'quiet': 'editor',
    'minimal': 'modal',
    'cinematic': 'landing',
    'focus-first': 'dashboard',
};

/**
 * Get background asset for current context and viewport
 * Returns undefined if no matching asset found
 */
export function getBackgroundAsset(
    context: AssetContext,
    isPortrait: boolean = false
): BackgroundAsset | undefined {
    const aspectRatio: AspectRatio = isPortrait ? '9_16' : '16_9';

    // Find exact match first
    const exactMatch = Object.values(BACKGROUND_ASSETS).find(
        (asset) => asset.context === context && asset.aspectRatio === aspectRatio && asset.isMaster
    );

    if (exactMatch) return exactMatch;

    // Fall back to any aspect ratio for this context
    const contextMatch = Object.values(BACKGROUND_ASSETS).find(
        (asset) => asset.context === context && asset.isMaster
    );

    if (contextMatch) return contextMatch;

    // Ultimate fallback: dashboard master
    return BACKGROUND_ASSETS['dashboard-master'];
}

/**
 * Get all assets for a specific context
 */
export function getAssetsForContext(context: AssetContext): BackgroundAsset[] {
    return Object.values(BACKGROUND_ASSETS).filter(
        (asset) => asset.context === context
    );
}

/**
 * Check if an asset supports hue-rotate theming
 */
export function supportsHueRotate(assetId: string): boolean {
    const asset = BACKGROUND_ASSETS[assetId];
    return asset?.isMaster ?? false;
}

/**
 * Get aria attributes for background images (always decorative)
 */
export function getBackgroundAriaProps(): Record<string, string | boolean> {
    return {
        'aria-hidden': true,
        role: 'presentation',
    };
}

/**
 * Build CSS background-image value for an asset
 */
export function buildBackgroundStyle(
    asset: BackgroundAsset | undefined,
    hueRotate: number = 0
): React.CSSProperties {
    if (!asset) {
        return {
            backgroundColor: 'var(--void)',
        };
    }

    const filter = asset.isMaster && hueRotate !== 0
        ? `hue-rotate(${hueRotate}deg)`
        : undefined;

    return {
        backgroundImage: `url(${asset.path})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter,
    };
}
