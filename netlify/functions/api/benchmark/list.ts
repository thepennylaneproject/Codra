/**
 * GET /api/benchmark/list
 * List all benchmarks for authenticated user
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import type { ListBenchmarksResponse } from '../../../../src/lib/ai/types-benchmark';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const handler: Handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    try {
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ success: false, error: 'Method not allowed' }),
            };
        }

        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid token' }) };
        }

        // Parse query parameters
        const url = new URL(event.rawUrl);
        const status = url.searchParams.get('status');
        const type = url.searchParams.get('type');
        const isFavorite = url.searchParams.get('favorite') === 'true';

        // Build query
        let query = supabase
            .from('benchmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }
        if (type) {
            query = query.eq('type', type);
        }
        if (isFavorite) {
            query = query.eq('is_favorite', true);
        }

        const { data: benchmarks, error, count } = await query;

        if (error) {
            throw new Error(error.message);
        }

        const response: ListBenchmarksResponse = {
            success: true,
            benchmarks: benchmarks || [],
            total: count || 0,
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error('List benchmarks error:', error);
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

export { handler };