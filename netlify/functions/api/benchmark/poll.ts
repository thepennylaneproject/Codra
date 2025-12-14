// netlify/functions/api/benchmark/poll.ts
/**
 * POST /api/benchmark/poll
 * Poll aimlapi batch status and store results
 * Can be called repeatedly until batch is complete
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import type { AimlApiBatchStatus } from '../../../../src/lib/ai/types-benchmark';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ENCRYPTION_APP_SECRET = process.env.ENCRYPTION_APP_SECRET || '';

interface PollRequest {
  benchmarkId: string;
  batchId: string;
  userId: string;
}

/**
 * Decrypt API key
 */
async function decryptApiKey(userId: string, provider: string): Promise<string> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('encrypted_key, iv, auth_tag')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    throw new Error(`No credentials for ${provider}`);
  }

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
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const body: PollRequest = JSON.parse(event.body || '{}');

    if (!body.benchmarkId || !body.batchId || !body.userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing required fields' }),
      };
    }

    // Get API key
    const apiKey = await decryptApiKey(body.userId, 'aimlapi');

    // Poll batch status
    const statusResponse = await fetch(`https://api.aimlapi.com/batch/${body.batchId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to get batch status: ${statusResponse.statusText}`);
    }

    const batchStatus: AimlApiBatchStatus = await statusResponse.json();
    console.log(
      `Batch ${body.batchId} status: ${batchStatus.status} (${batchStatus.request_counts.completed}/${batchStatus.request_counts.total})`
    );

    // Process completed results
    if (batchStatus.results && batchStatus.results.length > 0) {
      for (const result of batchStatus.results) {
        if (result.status === 'success' && result.result) {
          // Extract and store result
          const output = result.result.choices?.[0]?.message?.content || '';
          const tokens =
            (result.result.usage?.prompt_tokens || 0) +
            (result.result.usage?.completion_tokens || 0);

          // Estimate cost (simplified)
          const cost = estimateAimlApiCost(result.result.model, tokens);
          const now = new Date();

          // Update job
          await supabase
            .from('benchmark_jobs')
            .update({
              status: 'completed',
              output,
              latency_ms: 0, // Would need to track timing
              tokens_used: tokens,
              cost,
              completed_at: now.toISOString(),
            })
            .eq('id', result.id);
        } else if (result.status === 'failed' && result.error) {
          // Store error
          await supabase
            .from('benchmark_jobs')
            .update({
              status: 'failed',
              error_message: result.error.message || 'Unknown error',
              completed_at: new Date().toISOString(),
            })
            .eq('id', result.id);
        }
      }
    }

    // If batch is complete, compile results
    if (batchStatus.status === 'completed') {
      await compileBenchmarkResults(body.benchmarkId);
      console.log(`Benchmark ${body.benchmarkId} completed`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Benchmark completed',
          batchStatus: 'completed',
        }),
      };
    } else if (batchStatus.status === 'failed') {
      // Mark benchmark as failed
      await supabase
        .from('benchmarks')
        .update({ status: 'failed' })
        .eq('id', body.benchmarkId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Batch processing failed',
          batchStatus: 'failed',
        }),
      };
    } else {
      // Still processing - caller should retry
      return {
        statusCode: 202,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Batch still processing',
          batchStatus: batchStatus.status,
          progress: {
            completed: batchStatus.request_counts.completed,
            total: batchStatus.request_counts.total,
          },
        }),
      };
    }
  } catch (error) {
    console.error('Poll error:', error);

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
 * Compile benchmark results from completed jobs
 */
async function compileBenchmarkResults(benchmarkId: string): Promise<void> {
  // Get all jobs
  const { data: jobs, error: jobError } = await supabase
    .from('benchmark_jobs')
    .select('*')
    .eq('benchmark_id', benchmarkId)
    .order('job_index');

  if (jobError || !jobs || jobs.length === 0) {
    console.error('Failed to fetch jobs:', jobError);
    return;
  }

  // Build results
  const results = jobs
    .filter(job => job.status === 'completed')
    .map(job => ({
      model: job.model_id,
      provider: job.provider,
      output: job.output,
      metrics: {
        latency: job.latency_ms || 0,
        cost: job.cost || 0,
        tokens: job.tokens_used,
      },
    }));

  // Calculate summary
  const summary = calculateSummary(results);

  // Update benchmark
  const now = new Date();
  await supabase
    .from('benchmarks')
    .update({
      status: 'completed',
      results,
      summary,
      completed_at: now.toISOString(),
      progress: {
        current: jobs.length,
        total: jobs.length,
      },
    })
    .eq('id', benchmarkId);
}

/**
 * Calculate summary statistics
 */
function calculateSummary(results: any[]): any {
  if (results.length === 0) {
    return {
      totalResults: 0,
      totalCost: 0,
      avgLatency: 0,
      minLatency: 0,
      maxLatency: 0,
      recommendations: [],
    };
  }

  const metrics = results.map(r => r.metrics);
  const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
  const validLatencies = metrics.filter(m => m.latency > 0).map(m => m.latency);

  return {
    totalResults: results.length,
    totalCost: parseFloat(totalCost.toFixed(4)),
    avgLatency: validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b) / validLatencies.length) : 0,
    minLatency: validLatencies.length > 0 ? Math.min(...validLatencies) : 0,
    maxLatency: validLatencies.length > 0 ? Math.max(...validLatencies) : 0,
    winner: results.reduce((prev, current) =>
      (current.metrics.cost || 0) < (prev.metrics.cost || 0) ? current : prev
    )?.model,
    recommendations: generateRecommendations(results),
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(results: any[]): any[] {
  const recs = [];

  // Best cost
  const cheapest = results.reduce((prev, current) =>
    (current.metrics.cost || 0) < (prev.metrics.cost || 0) ? current : prev
  );

  recs.push({
    category: 'best',
    modelId: cheapest.model,
    reason: `Most cost-effective at $${(cheapest.metrics.cost || 0).toFixed(4)}`,
    score: 10,
  });

  // Balanced
  if (results.length > 1) {
    const balanced = results.reduce((prev, current) => {
      const prevScore = 1 / ((prev.metrics.cost || 1) * (prev.metrics.latency || 1));
      const currentScore = 1 / ((current.metrics.cost || 1) * (current.metrics.latency || 1));
      return currentScore > prevScore ? current : prev;
    });

    if (balanced.model !== cheapest.model) {
      recs.push({
        category: 'balanced',
        modelId: balanced.model,
        reason: 'Best balance of cost and speed',
        score: 8,
      });
    }
  }

  return recs;
}

/**
 * Estimate aimlapi cost
 */
function estimateAimlApiCost(model: string, tokens: number): number {
  // Simplified pricing - varies by model
  const costPerMToken = 0.5; // $0.50 per 1M tokens (approximate)
  return (tokens / 1000000) * costPerMToken;
}

export { handler };
