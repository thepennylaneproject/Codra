/**
 * Codra Asset Manifest v1 Types
 */

export type ManifestAssetStatus = 'draft' | 'ready' | 'archived';

export interface AssetBundle {
    id: string;
    workspaceId: string;
    name: string;
    description?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AssetFile {
    id: string;
    assetId: string;
    path: string;
    format: string; // 'svg' | 'png' | 'webp' | 'jpg' | 'other'
    mimeType?: string;
    width?: number;
    height?: number;
    scale: number; // 1, 2, 3
    sizeBytes?: number;
    hashSha256?: string;
}

export interface AssetPlacement {
    id: string;
    assetId: string;
    kind: 'import' | 'copy' | 'reference';
    file: string; // e.g. "src/components/Header.tsx"
    usage?: string;
    symbol?: string; // e.g. "LogoIcon"
}

export interface ManifestAsset {
    id: string;
    bundleId?: string;
    workspaceId: string;
    type: 'image' | 'video' | 'audio' | 'doc' | 'other';
    name: string;
    description?: string;

    // Manifest specific
    purpose?: string;
    variant?: string;
    status: ManifestAssetStatus;

    // Accessibility & SEO
    a11y?: {
        alt: string;
        decorative: boolean;
        longDescription?: string;
        ariaLabel?: string;
    };
    seo?: {
        caption?: string;
        keywords?: string[];
        subject?: string;
    };

    // Existing helper fields
    publicUrl: string;

    // Relations
    files: AssetFile[];
    placements: AssetPlacement[];
    tags: string[]; // now handled as array or relation, keeping compatible
}

// The full JSON structure for import/export
export interface AssetManifestJSON {
    version: '1.0.0';
    bundle: {
        name: string;
        description?: string;
        tags?: string[];
    };
    assets: Array<{
        name: string;
        type: ManifestAsset['type'];
        description?: string;
        purpose?: string;
        variant?: string;
        status?: ManifestAssetStatus;
        files: Array<Omit<AssetFile, 'id' | 'assetId' | 'hashSha256' | 'sizeBytes'>>;
        placements?: Array<Omit<AssetPlacement, 'id' | 'assetId'>>;
    }>;
}
