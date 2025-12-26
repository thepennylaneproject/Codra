/**
 * ASSET UPLOAD SERVICE
 * src/lib/assets/upload.ts
 * 
 * Client-side service for uploading assets to Supabase Storage
 * via Netlify Functions (to keep service key secure).
 */

import { supabase } from '../supabase';
import { Asset } from '../../domain/types';

interface UploadAssetOptions {
    file: File;
    projectId: string;
}

interface UploadResult {
    success: boolean;
    asset?: Asset;
    error?: string;
}

/**
 * Upload a file to Supabase Storage via the Netlify function.
 * 
 * Flow:
 * 1. Request signed upload URL from Netlify function
 * 2. Upload file directly to Supabase Storage using signed URL
 * 3. Finalize the asset metadata
 */
export async function uploadAsset({ file, projectId }: UploadAssetOptions): Promise<UploadResult> {
    try {
        // Get the current user's session token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
            return { success: false, error: 'Not authenticated' };
        }

        // Step 1: Request signed upload URL
        const uploadUrlResponse = await fetch('/.netlify/functions/assets_upload_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                workspaceId: projectId,
                name: file.name,
                type: getAssetType(file),
                mimeType: file.type || 'application/octet-stream',
                sizeBytes: file.size,
            }),
        });

        if (!uploadUrlResponse.ok) {
            const errorData = await uploadUrlResponse.json();
            return { success: false, error: errorData.error || 'Failed to get upload URL' };
        }

        const { uploadUrl, assetId, storagePath } = await uploadUrlResponse.json();

        // Step 2: Upload file directly to signed URL
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!uploadResponse.ok) {
            return { success: false, error: 'Failed to upload file to storage' };
        }

        // Step 3: Finalize the asset
        const finalizeResponse = await fetch('/.netlify/functions/assets_finalize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                assetId,
                workspaceId: projectId,
                name: file.name,
                type: getAssetType(file),
                mimeType: file.type || 'application/octet-stream',
                sizeBytes: file.size,
                storagePath,
            }),
        });

        if (!finalizeResponse.ok) {
            const errorData = await finalizeResponse.json();
            return { success: false, error: errorData.error || 'Failed to finalize asset' };
        }

        const { asset } = await finalizeResponse.json();

        return {
            success: true,
            asset: {
                id: asset.id,
                name: asset.name,
                url: asset.url,
                projectId: projectId,
            },
        };
    } catch (error) {
        console.error('Asset upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Upload multiple files with progress tracking.
 */
export async function uploadAssets(
    files: File[],
    projectId: string,
    onProgress?: (completed: number, total: number) => void
): Promise<{ successes: Asset[]; errors: string[] }> {
    const successes: Asset[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const result = await uploadAsset({ file: files[i], projectId });
        
        if (result.success && result.asset) {
            successes.push(result.asset);
        } else {
            errors.push(`${files[i].name}: ${result.error || 'Unknown error'}`);
        }

        onProgress?.(i + 1, files.length);
    }

    return { successes, errors };
}

/**
 * Determine asset type from file.
 */
function getAssetType(file: File): 'image' | 'document' | 'video' | 'audio' | 'other' {
    const mime = file.type.toLowerCase();
    
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (
        mime.includes('pdf') ||
        mime.includes('document') ||
        mime.includes('text')
    ) return 'document';
    
    return 'other';
}
