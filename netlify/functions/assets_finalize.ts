/**
 * Netlify Function: /api/assets/finalize
 * Finalizes asset upload by creating metadata entries
 * Called after client uploads file to signed URL
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import type { AssetFinalizeRequest, Asset } from '../../src/types/shared';

// Initialize Supabase with service key
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Verify authorization
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        const token = authHeader.replace('Bearer ', '');
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Invalid token' }),
            };
        }

        // Parse request body
        const body = JSON.parse(event.body || '{}') as AssetFinalizeRequest;
        const {
            assetId,
            workspaceId,
            name,
            description,
            type,
            mimeType,
            sizeBytes,
            width,
            height,
            durationMs,
            tags = [],
        } = body;

        // Validate input
        if (!assetId || !workspaceId || !name || !type || !mimeType || !sizeBytes) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Missing required fields',
                }),
            };
        }

        // Verify workspace access
        const { data: workspace, error: workspaceError } = await supabase
            .from('projects')
            .select('id, user_id')
            .eq('id', workspaceId)
            .eq('user_id', user.id)
            .single();

        if (workspaceError || !workspace) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Access denied to workspace' }),
            };
        }

        // Construct storage path
        const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `workspace/${workspaceId}/${assetId}/1/${sanitizedName}`;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('assets')
            .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;

        // Insert asset metadata
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .insert({
                id: assetId,
                workspace_id: workspaceId,
                user_id: user.id,
                type,
                name,
                description,
                storage_path: storagePath,
                public_url: publicUrl,
                mime_type: mimeType,
                size_bytes: sizeBytes,
                width,
                height,
                duration_ms: durationMs,
            })
            .select()
            .single();

        if (assetError) {
            console.error('Error creating asset:', assetError);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Failed to create asset metadata' }),
            };
        }

        // Insert tags
        if (tags.length > 0) {
            const tagRows = tags.map((tag) => ({
                asset_id: assetId,
                tag: tag.toLowerCase().trim(),
            }));

            const { error: tagsError } = await supabase
                .from('asset_tags')
                .insert(tagRows);

            if (tagsError) {
                console.error('Error creating tags:', tagsError);
                // Non-fatal, continue
            }
        }

        // Transform to camelCase for response
        const response: Asset = {
            id: asset.id,
            workspaceId: asset.workspace_id,
            userId: asset.user_id,
            type: asset.type,
            name: asset.name,
            description: asset.description,
            storagePath: asset.storage_path,
            publicUrl: asset.public_url,
            mimeType: asset.mime_type,
            sizeBytes: asset.size_bytes,
            width: asset.width,
            height: asset.height,
            durationMs: asset.duration_ms,
            hashSha256: asset.hash_sha256,
            tags,
            createdAt: asset.created_at,
            updatedAt: asset.updated_at,
        };

        return {
            statusCode: 201,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error('Error in assets-finalize:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
