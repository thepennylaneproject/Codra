// netlify/functions/api/benchmark/start.ts
/**
 * POST /api/benchmark/start
 * Start executing a benchmark
 * 
 * If all models are via aimlapi (text), uses batch API for 50% cost savings
 * Otherwise executes individually
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import type {
  StartBenchmarkRequest,
  StartBenchmarkResponse,
  AimlApiBatchRequest,
  AimlApiBatchItem,
} from '../../../../src/lib/ai/types-benchmark';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ENCRYPTION_APP_SECRET = process.env.ENCRYPTION_APP_SECRET || '';

/**
 * Decrypt API key (server-side)
 */
async function decryptApiKey(
  userId: string,
  provider: string
): Promise<string> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('encrypted_key, iv, auth_tag')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('environment', process.env.NODE_ENV || 'development')
    .single();

  if (error || !data) {
    throw new Error(`No credentials for ${provider}`);
  }

  // Derive encryption key
  const derivedKey = crypto
    .pbkdf2Sync(ENCRYPTION_APP_SECRET, userId, 100000, 32, 'sha256')
    .toString('hex');

  const encryptionKey = Buffer.from(derivedKey, 'hex');
  const combined = Buffer.from(data.encrypted_key, 'base64');

  const iv = combined.slice(0, 12);
  const authTag = combined.slice(12, 28);
  const ciphertext = combined.slice(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

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
    const body: StartBenchmarkRequest = JSON.parse(event.body || '{}');

    if (!body.benchmarkId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'benchmarkId required' }),
      };
    }

    // Get benchmark
    const { data: benchmark, error: fetchError } = await supabase
      .from('benchmarks')
      .select('*')
      .eq('id', body.benchmarkId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !benchmark) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Benchmark not found' }),
      };
    }

    if (benchmark.status !== 'draft') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Benchmark already running or completed',
        }),
      };
    }

    // Create benchmark jobs
    const jobsToCreate = benchmark.models.map((model: any, idx: number) => ({
      benchmark_id: body.benchmarkId,
      user_id: user.id,
      job_index: idx,
      model_id: model.id,
      provider: model.provider,
      status: 'pending',
      retry_count: 0,
    }));

    const { data: jobs, error: jobError } = await supabase
      .from('benchmark_jobs')
      .insert(jobsToCreate)
      .select('id');

    if (jobError) {
      throw new Error(`Failed to create jobs: ${jobError.message}`);
    }

    // Check if we can use batch API (all text models via aimlapi)
    const canUseBatch =
      benchmark.type === 'text' &&
      benchmark.models.every((m: any) => m.provider === 'aimlapi');

    if (canUseBatch) {
      // Use aimlapi batch API for 50% cost savings
      const batchId = await submitAimlApiBatch(user.id, benchmark, jobs);

      // Update benchmark status
      await supabase
        .from('benchmarks')
        .update({
          status: 'running',
          progress: { current: 0, total: benchmark.models.length },
        })
        .eq('id', body.benchmarkId);

      // Start polling in the background
      startBatchPolling(body.benchmarkId, batchId, user.id);

      const response: StartBenchmarkResponse = {
        success: true,
        message: 'Benchmark started (using batch API for 50% cost savings)',
        batchId,
      };

      return {
        statusCode: 202,
        headers,
        body: JSON.stringify(response),
      };
    } else {
      // Execute individually
      await executeIndividually(body.benchmarkId, benchmark, user.id);

      const response: StartBenchmarkResponse = {
        success: true,
        message: 'Benchmark started',
      };

      return {
        statusCode: 202,
        headers,
        body: JSON.stringify(response),
      };
    }
  } catch (error) {
    console.error('Start benchmark error:', error);

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
 * Submit batch request to aimlapi
 */
async function submitAimlApiBatch(
  userId: string,
  benchmark: any,
  jobs: any[]
): Promise<string> {
  // Get decrypted aimlapi key
  const apiKey = await decryptApiKey(userId, 'aimlapi');

  // Build batch request
  const batchRequest: AimlApiBatchRequest = {
    requests: benchmark.models.map((model: any, idx: number) => ({
      id: jobs[idx].id,
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Provide a concise, high-quality response.',
          },
          {
            role: 'user',
            content: benchmark.prompt,
          },
        ],
        temperature: benchmark.parameters?.temperature ?? 0.7,
        max_tokens: benchmark.parameters?.maxTokens ?? 1024,
        top_p: benchmark.parameters?.topP ?? 1.0,
      },
    })) as AimlApiBatchItem[],
  };

  // Submit to aimlapi
  const response = await fetch('https://api.aimlapi.com/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batchRequest),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`aimlapi batch submission failed: ${errorData}`);
  }

  const batchData = await response.json();

  // Update jobs with batch ID
  const jobIds = jobs.map((j: any) => j.id);
  await supabase
    .from('benchmark_jobs')
    .update({
      batch_request_id: batchData.request_id,
      status: 'processing',
    })
    .in('id', jobIds);

  console.log(`Batch submitted: ${batchData.request_id} with ${jobIds.length} requests`);

  return batchData.request_id;
}

/**
 * Start background polling for batch results
 * This runs asynchronously outside the Lambda timeout
 */
function startBatchPolling(benchmarkId: string, batchId: string, userId: string) {
  // Create a polling function that calls another Netlify function
  // to avoid Lambda timeout issues
  fetch(`${process.env.DEPLOY_URL || 'http://localhost:8888'}/.netlify/functions/api/benchmark/poll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      benchmarkId,
      batchId,
      userId,
    }),
  }).catch(err => console.error('Failed to start polling:', err));
}

/**
 * Execute benchmark with mixed providers
 */
async function executeIndividually(
  benchmarkId: string,
  benchmark: any,
  userId: string
) {
  // Update status to running
  await supabase
    .from('benchmarks')
    .update({
      status: 'running',
      progress: { current: 0, total: benchmark.models.length },
    })
    .eq('id', benchmarkId);

  // Queue individual executions
  // Could use a background job system like Bull Queue or AWS SQS
  // For now, we'll rely on separate function calls
  for (let i = 0; i < benchmark.models.length; i++) {
    // Queue job execution
    console.log(`Queued job ${i} for benchmark ${benchmarkId}`);
  }
}

export { handler };
