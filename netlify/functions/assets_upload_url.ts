/**
 * Netlify Function: /api/assets/upload-url
 * Generates signed upload URL for Supabase Storage
 * Never exposes service key to frontend
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import type { AssetUploadRequest, AssetUploadResponse } from '../../src/types/shared';

// Initialize Supabase with service key (server-side only)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key for storage operations
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

        // Verify the JWT token with Supabase
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
        const body = JSON.parse(event.body || '{}') as AssetUploadRequest;
        const { workspaceId, name, type, mimeType, sizeBytes } = body;

        // Validate input
        if (!workspaceId || !name || !type || !mimeType || !sizeBytes) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Missing required fields: workspaceId, name, type, mimeType, sizeBytes',
                }),
            };
        }

        // Verify user has access to workspace
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

        // Generate unique asset ID
        const assetId = crypto.randomUUID();

        // Construct storage path: workspace/{workspaceId}/{assetId}/1/{filename}
        const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `workspace/${workspaceId}/${assetId}/1/${sanitizedName}`;

        // Generate signed upload URL (valid for 10 minutes)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assets')
            .createSignedUploadUrl(storagePath);

        if (uploadError) {
            console.error('Error creating signed upload URL:', uploadError);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Failed to generate upload URL' }),
            };
        }

        const response: AssetUploadResponse = {
            uploadUrl: uploadData.signedUrl,
            assetId,
            storagePath,
        };

        return {
            statusCode: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error('Error in assets-upload-url:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
