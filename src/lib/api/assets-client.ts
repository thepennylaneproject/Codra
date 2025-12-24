/**
 * Assets Client SDK
 * Client-side API for asset operations
 */

import { supabase } from '../supabase';
import type {
    Asset,
    AssetUploadRequest,
    AssetUploadResponse,
    AssetFinalizeRequest,
    AssetListFilters,
    AssetListResponse,
    AssetVersion,
    ImageConvertRequest,
    ImageConvertResponse,
} from '../../types/shared';

const API_BASE = '/.netlify/functions';

/**
 * Get authorization header with current user token
 */
async function getAuthHeader(): Promise<string> {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }

    return `Bearer ${session.access_token}`;
}

/**
 * Helper to make authenticated requests and handle JSON parsing/errors
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authHeader = await getAuthHeader();

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            ...options.headers,
        },
    });

    // Check for HTML response (Vite SPA fallback)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        throw new Error('Backend not available (HTML response). Ensure you are running "netlify dev".');
    }

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
        } catch (e) {
            // ignore JSON parse error on error response
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * Assets Client API
 */
export const assetsClient = {
    /**
     * Get a signed upload URL for uploading an asset
     */
    async getUploadUrl(requestBody: AssetUploadRequest): Promise<AssetUploadResponse> {
        return request<AssetUploadResponse>('/assets_upload_url', {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
    },

    /**
     * Upload a file to a signed URL
     */
    async uploadFile(url: string, file: File): Promise<void> {
        const response = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
    },

    /**
     * Finalize an upload by creating metadata
     */
    async finalizeUpload(metadata: AssetFinalizeRequest): Promise<Asset> {
        return request<Asset>('/assets_finalize', {
            method: 'POST',
            body: JSON.stringify(metadata),
        });
    },

    /**
     * List assets with filters
     */
    async list(filters: AssetListFilters): Promise<AssetListResponse> {
        const params = new URLSearchParams();
        if (filters.workspaceId) params.set('workspaceId', filters.workspaceId);
        if (filters.type) params.set('type', filters.type);
        if (filters.tags) params.set('tags', filters.tags.join(','));
        if (filters.search) params.set('search', filters.search);
        if (filters.page) params.set('page', filters.page.toString());
        if (filters.limit) params.set('limit', filters.limit.toString());

        return request<AssetListResponse>(`/assets_list?${params}`, {
            method: 'GET',
        });
    },

    /**
     * Get a single asset by ID
     */
    async get(assetId: string, workspaceId: string): Promise<Asset | null> {
        const result = await this.list({ workspaceId, limit: 1 });
        return result.assets.find((a: Asset) => a.id === assetId) || null;
    },

    /**
     * Delete an asset
     */
    async delete(assetId: string, hard = false): Promise<void> {
        const params = new URLSearchParams({
            assetId,
            hard: hard.toString(),
        });

        return request<void>(`/assets_delete?${params}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get version history for an asset
     */
    async getVersions(assetId: string): Promise<AssetVersion[]> {
        // Query asset_versions table directly via Supabase
        const { data, error } = await supabase
            .from('asset_versions')
            .select('*')
            .eq('asset_id', assetId)
            .order('version', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch versions');
        }

        return (data || []).map(v => ({
            id: v.id,
            assetId: v.asset_id,
            version: v.version,
            storagePath: v.storage_path,
            publicUrl: v.public_url,
            mimeType: v.mime_type,
            sizeBytes: v.size_bytes,
            width: v.width,
            height: v.height,
            createdAt: v.created_at,
        }));
    },

    /**
     * Complete upload flow: get URL, upload file, finalize
     */
    async upload(
        file: File,
        metadata: Omit<AssetFinalizeRequest, 'assetId' | 'mimeType' | 'sizeBytes'>
    ): Promise<Asset> {
        // Step 1: Get upload URL
        const uploadResponse = await this.getUploadUrl({
            workspaceId: metadata.workspaceId,
            name: metadata.name,
            type: metadata.type,
            mimeType: file.type,
            sizeBytes: file.size,
        });

        // Step 2: Upload file
        await this.uploadFile(uploadResponse.uploadUrl, file);

        // Step 3: Finalize
        return this.finalizeUpload({
            ...metadata,
            assetId: uploadResponse.assetId,
            mimeType: file.type,
            sizeBytes: file.size,
        });
    },

    /**
     * Create a new version of an image
     */
    async createVersion(
        assetId: string,
        operation: 'resize' | 'crop' | 'convert' | 'compress' | 'thumbnail',
        params: ImageConvertRequest['params']
    ): Promise<ImageConvertResponse> {
        const requestBody: ImageConvertRequest = {
            assetId,
            operation,
            params,
        };

        return request<ImageConvertResponse>('/image_convert', {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
    },
};
