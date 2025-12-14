// ============================================================================
// netlify/functions/api/benchmark/get.ts
// ============================================================================

/**
 * GET /api/benchmark/get?id=<benchmark_id>
 * Get single benchmark by ID
 */

import { Handler as HandlerGet } from '@netlify/functions';
import { createClient as createClientGet } from '@supabase/supabase-js';
import type { GetBenchmarkResponse } from '../../../../src/lib/ai/types-benchmark';

const supabaseGet = createClientGet(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const getHandler: HandlerGet = async (event, context) => {
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
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabaseGet.auth.getUser(token);

        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid token' }) };
        }

        const url = new URL(event.rawUrl);
        const benchmarkId = url.searchParams.get('id');

        if (!benchmarkId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'benchmark_id required' }),
            };
        }

        const { data: benchmark, error } = await supabaseGet
            .from('benchmarks')
            .select('*')
            .eq('id', benchmarkId)
            .eq('user_id', user.id)
            .single();

        if (error || !benchmark) {
            return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Benchmark not found' }) };
        }

        const response: GetBenchmarkResponse = {
            success: true,
            benchmark: benchmark as any,
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
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