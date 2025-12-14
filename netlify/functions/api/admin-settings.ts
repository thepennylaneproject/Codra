/**
 * Admin Settings Endpoint
 * 
 * GET /api/admin-settings?type={app|provider|model}&workspace_id=...
 * POST /api/admin-settings (body: { type, workspace_id, data })
 * DELETE /api/admin-settings?type=...&id=...&workspace_id=...
 * 
 * CRUD operations for admin settings with authorization
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../utils/admin-auth';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        // Require admin authorization
        await requireAdmin(event);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // GET - Fetch settings
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            const type = params.type;
            const workspaceId = params.workspace_id;

            if (!type || !workspaceId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing type or workspace_id parameter' }),
                };
            }

            let tableName: string;
            switch (type) {
                case 'app':
                    tableName = 'app_settings';
                    break;
                case 'provider':
                    tableName = 'provider_settings';
                    break;
                case 'model':
                    tableName = 'model_settings';
                    break;
                default:
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Invalid type. Must be app, provider, or model' }),
                    };
            }

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('workspace_id', workspaceId);

            if (error) {
                console.error(`Error fetching ${type} settings:`, error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Failed to fetch settings' }),
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ data }),
            };
        }

        // POST - Create/Update settings (upsert)
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { type, workspace_id, data } = body;

            if (!type || !workspace_id || !data) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing type, workspace_id, or data in request body' }),
                };
            }

            let tableName: string;
            let upsertData: any;

            switch (type) {
                case 'app':
                    tableName = 'app_settings';
                    upsertData = {
                        workspace_id,
                        ...data,
                    };
                    break;
                case 'provider':
                    tableName = 'provider_settings';
                    if (!data.provider_id) {
                        return {
                            statusCode: 400,
                            headers,
                            body: JSON.stringify({ error: 'provider_id required for provider settings' }),
                        };
                    }
                    upsertData = {
                        workspace_id,
                        ...data,
                    };
                    break;
                case 'model':
                    tableName = 'model_settings';
                    if (!data.model_id) {
                        return {
                            statusCode: 400,
                            headers,
                            body: JSON.stringify({ error: 'model_id required for model settings' }),
                        };
                    }
                    upsertData = {
                        workspace_id,
                        ...data,
                    };
                    break;
                default:
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Invalid type' }),
                    };
            }

            // Determine unique constraint columns for upsert
            let onConflict: string;
            if (type === 'app') {
                onConflict = 'workspace_id';
            } else if (type === 'provider') {
                onConflict = 'workspace_id,provider_id';
            } else {
                onConflict = 'workspace_id,model_id';
            }

            const { data: result, error } = await supabase
                .from(tableName)
                .upsert(upsertData, { onConflict })
                .select();

            if (error) {
                console.error(`Error upserting ${type} settings:`, error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Failed to save settings', details: error.message }),
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ data: result }),
            };
        }

        // DELETE - Remove settings
        if (event.httpMethod === 'DELETE') {
            const params = event.queryStringParameters || {};
            const type = params.type;
            const id = params.id;

            if (!type || !id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing type or id parameter' }),
                };
            }

            let tableName: string;
            switch (type) {
                case 'app':
                    tableName = 'app_settings';
                    break;
                case 'provider':
                    tableName = 'provider_settings';
                    break;
                case 'model':
                    tableName = 'model_settings';
                    break;
                default:
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Invalid type' }),
                    };
            }

            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) {
                console.error(`Error deleting ${type} settings:`, error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Failed to delete settings' }),
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true }),
            };
        }

        // Method not allowed
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };

    } catch (error: any) {
        console.error('Admin settings error:', error);

        // Check if it's an auth error
        if (error.message?.includes('Unauthorized') || error.message?.includes('authorization')) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
