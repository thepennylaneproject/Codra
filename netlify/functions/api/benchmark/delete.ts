// ============================================================================
// netlify/functions/api/benchmark/delete.ts
// ============================================================================

/**
 * DELETE /api/benchmark/delete
 * Delete benchmark by ID
 */

import { Handler as HandlerDelete } from '@netlify/functions';
import { createClient as createClientDelete } from '@supabase/supabase-js';

const supabaseDelete = createClientDelete(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const deleteHandler: HandlerDelete = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabaseDelete.auth.getUser(token);

        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid token' }) };
        }

        const body = JSON.parse(event.body || '{}');

        if (!body.benchmarkId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'benchmarkId required' }),
            };
        }

        // Verify ownership before deleting
        const { data: benchmark } = await supabaseDelete
            .from('benchmarks')
            .select('user_id')
            .eq('id', body.benchmarkId)
            .single();

        if (!benchmark || benchmark.user_id !== user.id) {
            return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Forbidden' }) };
        }

        // Delete (cascades to jobs and history via ON DELETE CASCADE)
        const { error } = await supabaseDelete
            .from('benchmarks')
            .delete()
            .eq('id', body.benchmarkId);

        if (error) {
            throw error;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Benchmark deleted' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};