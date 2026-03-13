// ============================================================================
// ASSET LIBRARY TYPES
// ============================================================================

/**
 * Asset type enumeration
 */
export type AssetType = "image" | "video" | "audio" | "doc" | "other";

/**
 * Lightweight asset reference for embedding in contexts
 */
export type AssetRef = {
    id: string
    type: AssetType
    url: string
    name?: string
    mimeType?: string
    width?: number
    height?: number
    sizeBytes?: number
    tags?: string[]
    source?: "upload" | "generated" | "import"
}

/**
 * Full asset metadata (from database)
 */
export interface Asset {
    id: string
    workspaceId: string
    userId: string
    type: AssetType
    name: string
    description?: string
    storagePath: string
    publicUrl: string
    mimeType: string
    sizeBytes: number
    width?: number
    height?: number
    durationMs?: number
    hashSha256?: string
    tags: string[]
    deletedAt?: string
    createdAt: string
    updatedAt: string
}

/**
 * Asset version history entry
 */
export interface AssetVersion {
    id: string
    assetId: string
    version: number
    storagePath: string
    publicUrl: string
    mimeType: string
    sizeBytes: number
    width?: number
    height?: number
    createdAt: string
}

/**
 * Request to get an upload URL
 */
export interface AssetUploadRequest {
    workspaceId: string
    name: string
    type: AssetType
    mimeType: string
    sizeBytes: number
}

/**
 * Response with signed upload URL
 */
export interface AssetUploadResponse {
    uploadUrl: string
    assetId: string
    storagePath: string
}

/**
 * Metadata to finalize an upload
 */
export interface AssetFinalizeRequest {
    assetId: string
    workspaceId: string
    name: string
    description?: string
    type: AssetType
    mimeType: string
    sizeBytes: number
    width?: number
    height?: number
    durationMs?: number
    tags?: string[]
}

/**
 * Asset list filters
 */
export interface AssetListFilters {
    workspaceId?: string
    type?: AssetType
    tags?: string[]
    search?: string
    page?: number
    limit?: number
}

/**
 * Paginated asset list response
 */
export interface AssetListResponse {
    assets: Asset[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

/**
 * Image conversion request parameters
 */
export interface ImageConvertRequest {
    assetId: string;
    operation: 'resize' | 'crop' | 'convert' | 'compress' | 'thumbnail';
    params: {
        width?: number;
        height?: number;
        format?: 'jpeg' | 'png' | 'webp' | 'avif';
        quality?: number;
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
}

/**
 * Image conversion response
 */
export interface ImageConvertResponse {
    versionId: string;
    publicUrl: string;
    width: number;
    height: number;
    sizeBytes: number;
    mimeType: string;
}