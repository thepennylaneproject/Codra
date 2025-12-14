/**
 * Netlify Function: /api/assets/list
 * Lists assets with pagination and filtering
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import type { AssetListFilters, AssetListResponse, Asset } from '../../src/types/shared';

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Only allow GET
    if (event.httpMethod !== 'GET') {
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

        // Parse query parameters
        const params = event.queryStringParameters || {};
        const workspaceId = params.workspaceId;
        const type = params.type;
        const search = params.search;
        const tags = params.tags ? params.tags.split(',').map(t => t.trim()) : undefined;
        const page = parseInt(params.page || '1', 10);
        const limit = Math.min(parseInt(params.limit || '20', 10), 100); // Cap at 100

        if (!workspaceId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'workspaceId is required' }),
            };
        }

        // Verify workspace access
        const { data: workspace, error: workspaceError } = await supabase
            .from('projects')
            .select('id')
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

        // Build query
        let query = supabase
            .from('assets')
            .select('*', { count: 'exact' })
            .eq('workspace_id', workspaceId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        // Apply filters
        if (type) {
            query = query.eq('type', type);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: assets, error: queryError, count } = await query;

        if (queryError) {
            console.error('Error querying assets:', queryError);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Failed to fetch assets' }),
            };
        }

        // Fetch tags for each asset
        const assetIds = assets?.map(a => a.id) || [];
        let assetTagsMap: Record<string, string[]> = {};

        if (assetIds.length > 0) {
            const { data: tagData } = await supabase
                .from('asset_tags')
                .select('asset_id, tag')
                .in('asset_id', assetIds);

            if (tagData) {
                assetTagsMap = tagData.reduce((acc, { asset_id, tag }) => {
                    if (!acc[asset_id]) acc[asset_id] = [];
                    acc[asset_id].push(tag);
                    return acc;
                }, {} as Record<string, string[]>);
            }
        }

        // Filter by tags if specified
        let filteredAssets = assets || [];
        if (tags && tags.length > 0) {
            filteredAssets = filteredAssets.filter(asset => {
                const assetTags = assetTagsMap[asset.id] || [];
                return tags.some(tag => assetTags.includes(tag.toLowerCase()));
            });
        }

        // Transform to camelCase
        const transformedAssets: Asset[] = filteredAssets.map(asset => ({
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
            tags: assetTagsMap[asset.id] || [],
            createdAt: asset.created_at,
            updatedAt: asset.updated_at,
        }));

        const total = count || 0;
        const hasMore = (page * limit) < total;

        const response: AssetListResponse = {
            assets: transformedAssets,
            total,
            page,
            limit,
            hasMore,
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
        console.error('Error in assets-list:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
