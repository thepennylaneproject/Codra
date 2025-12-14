// netlify/functions/api/benchmark/list.ts
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

// ============================================================================
// netlify/functions/api/benchmark/export.ts
// ============================================================================

/**
 * POST /api/benchmark/export
 * Export benchmark results as JSON or CSV
 */

import { Handler as HandlerExport } from '@netlify/functions';
import { createClient as createClientExport } from '@supabase/supabase-js';
import type { ExportBenchmarkRequest, ExportBenchmarkResponse } from '../../../../src/lib/ai/types-benchmark';

const supabaseExport = createClientExport(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const exportHandler: HandlerExport = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { data: { user }, error: authError } = await supabaseExport.auth.getUser(token);

    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Invalid token' }) };
    }

    const body: ExportBenchmarkRequest = JSON.parse(event.body || '{}');

    if (!body.benchmarkId || !body.format) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'benchmarkId and format required' }),
      };
    }

    if (body.format !== 'json' && body.format !== 'csv') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'format must be json or csv' }),
      };
    }

    // Get benchmark
    const { data: benchmark, error: fetchError } = await supabaseExport
      .from('benchmarks')
      .select('*')
      .eq('id', body.benchmarkId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !benchmark) {
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Benchmark not found' }) };
    }

    // Format export
    let content: string;
    let mimeType: string;
    let filename: string;

    if (body.format === 'json') {
      content = JSON.stringify(benchmark, null, 2);
      mimeType = 'application/json';
      filename = `benchmark-${benchmark.id}.json`;
    } else {
      // CSV format
      const headers = ['Model', 'Provider', 'Latency (ms)', 'Cost (USD)', 'Tokens'];
      const rows = benchmark.results.map((r: any) => [
        r.model,
        r.provider,
        r.metrics.latency,
        r.metrics.cost,
        r.metrics.tokens || '',
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map((cell: any) => `"${cell}"`).join(','))
        .join('\n');

      content = csvContent;
      mimeType = 'text/csv';
      filename = `benchmark-${benchmark.id}.csv`;
    }

    // In production, store in R2 or other storage and return signed URL
    // For now, return content directly (small files)
    const response: ExportBenchmarkResponse = {
      success: true,
      url: `data:${mimeType};base64,${Buffer.from(content).toString('base64')}`,
    };

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Disposition': `attachment; filename="${filename}"` },
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
