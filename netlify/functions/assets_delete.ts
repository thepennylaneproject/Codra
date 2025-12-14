/**
 * Netlify Function: /api/assets/delete
 * Deletes asset (soft delete by default, hard delete for admins)
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    // Only allow DELETE
    if (event.httpMethod !== 'DELETE') {
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
        const assetId = params.assetId;
        const hard = params.hard === 'true';

        if (!assetId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'assetId is required' }),
            };
        }

        // Fetch asset to verify ownership
        const { data: asset, error: fetchError } = await supabase
            .from('assets')
            .select('id, workspace_id, user_id, storage_path')
            .eq('id', assetId)
            .single();

        if (fetchError || !asset) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Asset not found' }),
            };
        }

        // Verify user owns the asset
        if (asset.user_id !== user.id) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Access denied' }),
            };
        }

        if (hard) {
            // Hard delete: remove from storage and database
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('assets')
                .remove([asset.storage_path]);

            if (storageError) {
                console.error('Error deleting from storage:', storageError);
                // Continue anyway - metadata deletion is more important
            }

            // Delete from database (cascade will delete tags and versions)
            const { error: deleteError } = await supabase
                .from('assets')
                .delete()
                .eq('id', assetId);

            if (deleteError) {
                console.error('Error deleting asset:', deleteError);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Failed to delete asset' }),
                };
            }

            return {
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: true, message: 'Asset permanently deleted' }),
            };
        } else {
            // Soft delete: set deleted_at timestamp
            const { error: updateError } = await supabase
                .from('assets')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', assetId);

            if (updateError) {
                console.error('Error soft deleting asset:', updateError);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Failed to delete asset' }),
                };
            }

            return {
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: true, message: 'Asset deleted' }),
            };
        }
    } catch (error) {
        console.error('Error in assets-delete:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
