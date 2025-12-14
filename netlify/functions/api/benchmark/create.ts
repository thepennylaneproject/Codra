// netlify/functions/api/benchmark/create.ts
/**
 * POST /api/benchmark/create
 * Create a new benchmark
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import type { CreateBenchmarkRequest, CreateBenchmarkResponse } from '../../../../src/lib/ai/types-benchmark';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const handler: Handler = async (event, context) => {
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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    // Authenticate
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      };
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid token' }),
      };
    }

    // Parse request
    const body: CreateBenchmarkRequest = JSON.parse(event.body || '{}');

    // Validate
    if (!body.name || !body.prompt || !body.type || !body.models || body.models.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: name, prompt, type, models',
        }),
      };
    }

    if (body.type !== 'text' && body.type !== 'image') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Type must be "text" or "image"' }),
      };
    }

    if (body.models.length < 2 || body.models.length > 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Benchmark requires 2-5 models',
        }),
      };
    }

    // Get workspace ID from header
    const workspaceId = event.headers['x-workspace-id'];

    // Create benchmark
    const { data: benchmark, error: createError } = await supabase
      .from('benchmarks')
      .insert({
        user_id: user.id,
        workspace_id: workspaceId,
        name: body.name,
        description: body.description,
        prompt: body.prompt,
        type: body.type,
        models: body.models.map(modelId => ({
          id: modelId,
          name: modelId,
          provider: detectProvider(modelId),
        })),
        parameters: body.parameters || {},
        iterations: Math.min(body.iterations || 1, 5),
        status: 'draft',
        progress: { current: 0, total: 0 },
      })
      .select('id')
      .single();

    if (createError || !benchmark) {
      throw new Error(`Failed to create benchmark: ${createError?.message}`);
    }

    // Log creation
    console.log(`Benchmark created: ${benchmark.id} by user ${user.id}`);

    const response: CreateBenchmarkResponse = {
      success: true,
      benchmarkId: benchmark.id,
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Create benchmark error:', error);

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

/**
 * Detect provider from model ID
 */
function detectProvider(
  modelId: string
): 'aimlapi' | 'deepseek' | 'gemini' | 'deepai' | 'openai' | 'anthropic' {
  if (modelId.includes('gpt')) return 'openai';
  if (modelId.includes('deepseek')) return 'deepseek';
  if (modelId.includes('gemini')) return 'gemini';
  if (modelId.includes('claude')) return 'anthropic';
  if (modelId.includes('text2img') || modelId.includes('deepdream')) return 'deepai';
  return 'aimlapi'; // default
}

export { handler };
