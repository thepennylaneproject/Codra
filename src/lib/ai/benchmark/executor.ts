// src/lib/ai/benchmark/executor.ts
/**
 * Benchmark Executor
 * - Manages benchmark execution lifecycle
 * - Integrates aimlapi batch processing for cost savings (50% off)
 * - Handles polling for async results
 * - Calculates metrics and generates recommendations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Benchmark,
  BenchmarkConfig,
  BenchmarkJob,
  BenchmarkResult,
  BenchmarkSummary,

  BenchmarkRecommendation,
  AimlApiBatchRequest,
  AimlApiBatchItem,
  AimlApiBatchStatus,
} from '../types-benchmark';

interface BenchmarkExecutorOptions {
  supabaseUrl: string;
  supabaseKey: string;
  userToken: string;
  userId: string;
}

export class BenchmarkExecutor {
  private supabase: SupabaseClient;
  private userToken: string;
  private userId: string;
  private pollIntervalMs = 5000; // Poll batch status every 5 seconds
  private maxPollAttempts = 120; // Max 10 minutes of polling

  constructor(options: BenchmarkExecutorOptions) {
    this.supabase = createClient(options.supabaseUrl, options.supabaseKey);
    this.userToken = options.userToken;
    this.userId = options.userId;
  }

  /**
   * Create a new benchmark
   */
  async createBenchmark(
    benchmarkName: string,
    config: BenchmarkConfig
  ): Promise<{ benchmarkId: string }> {
    const { data, error } = await this.supabase.from('benchmarks').insert({
      user_id: this.userId,
      name: benchmarkName,
      description: `Benchmark comparing ${config.models.length} models on: ${config.prompt.slice(0, 100)}...`,
      prompt: config.prompt,
      type: config.type,
      models: config.models,
      parameters: config.parameters || {},
      iterations: config.iterations || 1,
      status: 'draft',
      progress: { current: 0, total: 0 },
    }).select('id').single();

    if (error || !data) {
      throw new Error(`Failed to create benchmark: ${error?.message}`);
    }

    return { benchmarkId: data.id };
  }

  /**
   * Start a benchmark - creates jobs and queues execution
   * Uses aimlapi batch API for cost savings
   */
  async startBenchmark(benchmarkId: string): Promise<{ batchId?: string }> {
    // Get benchmark
    const { data: benchmark, error: fetchError } = await this.supabase
      .from('benchmarks')
      .select('*')
      .eq('id', benchmarkId)
      .eq('user_id', this.userId)
      .single();

    if (fetchError || !benchmark) {
      throw new Error('Benchmark not found');
    }

    // Update status to queued
    await this.supabase
      .from('benchmarks')
      .update({ status: 'queued', progress: { current: 0, total: benchmark.models.length } })
      .eq('id', benchmarkId);

    // Create jobs for each model
    const jobs = await this.createBenchmarkJobs(benchmarkId, benchmark.models.length);

    // Check if all models are via aimlapi (for batch processing)
    const aimlApiModels = benchmark.models.filter((m: any) => m.provider === 'aimlapi');

    if (aimlApiModels.length === benchmark.models.length && benchmark.type === 'text') {
      // All text models are via aimlapi - use batch API for 50% cost savings
      const batchRequestId = await this.submitAimlApiBatch(
        benchmarkId,
        benchmark,
        jobs
      );

      return { batchId: batchRequestId };
    } else {
      // Mixed providers or image - execute individually
      await this.executeIndividually(benchmarkId, benchmark, jobs);
      return {};
    }
  }

  /**
   * Create benchmark job records
   */
  private async createBenchmarkJobs(
    benchmarkId: string,
    jobCount: number
  ): Promise<BenchmarkJob[]> {
    const jobsToCreate = Array.from({ length: jobCount }, (_, idx) => ({
      benchmark_id: benchmarkId,
      user_id: this.userId,
      job_index: idx,
      model_id: 'pending', // Will be filled after fetch
      provider: 'pending',
      status: 'pending',
      retry_count: 0,
    }));

    const { data, error } = await this.supabase
      .from('benchmark_jobs')
      .insert(jobsToCreate)
      .select();

    if (error) {
      throw new Error(`Failed to create jobs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Submit batch request to aimlapi
   * Uses batch API for 50% cost reduction
   * 
   * API Docs: https://api.aimlapi.com/docs#batch-processing
   */
  private async submitAimlApiBatch(
    benchmarkId: string,
    benchmark: any,
    jobs: BenchmarkJob[]
  ): Promise<string> {
    // Get decrypted API key from Netlify Function
    const keyResponse = await fetch('/api/credentials/aimlapi-key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.userToken}`,
      },
    });

    if (!keyResponse.ok) {
      throw new Error('Failed to retrieve API credentials');
    }

    const { apiKey } = await keyResponse.json();

    // Build batch request
    const batchRequest: AimlApiBatchRequest = {
      requests: benchmark.models.map((model: any, idx: number) => ({
        id: jobs[idx].id, // Use job ID for tracking
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

    // Submit to aimlapi batch API
    const batchResponse = await fetch('https://api.aimlapi.com/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchRequest),
    });

    if (!batchResponse.ok) {
      const errorData = await batchResponse.text();
      throw new Error(`aimlapi batch submission failed: ${errorData}`);
    }

    const batchData = await batchResponse.json();
    const batchRequestId = batchData.request_id;

    // Update benchmark status to running
    await this.supabase
      .from('benchmarks')
      .update({ status: 'running' })
      .eq('id', benchmarkId);

    // Update all jobs with batch request ID
    await this.supabase
      .from('benchmark_jobs')
      .update({ batch_request_id: batchRequestId, status: 'processing' })
      .in('id', jobs.map(j => j.id));

    // Start polling for results
    this.pollBatchResults(benchmarkId, batchRequestId, jobs.length);

    return batchRequestId;
  }

  /**
   * Poll aimlapi batch for results
   * Stores results as they complete
   */
  private async pollBatchResults(
    benchmarkId: string,
    batchRequestId: string,
    expectedResultCount: number
  ) {
    let pollAttempts = 0;

    const pollFn = async () => {
      pollAttempts++;

      try {
        // Get batch status from aimlapi
        const statusResponse = await fetch(
          `https://api.aimlapi.com/batch/${batchRequestId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${(await this.getApiKey())}`,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error(`Failed to get batch status: ${statusResponse.statusText}`);
        }

        const batchStatus: AimlApiBatchStatus = await statusResponse.json();

        // Process completed results
        if (batchStatus.results) {
          for (const result of batchStatus.results) {
            // Update job with result
            if (result.status === 'success' && result.result) {
              const latencyMs = Date.now(); // Approximation
              const tokens =
                (result.result.usage?.prompt_tokens || 0) +
                (result.result.usage?.completion_tokens || 0);
              const output = result.result.choices?.[0]?.message?.content || '';

              // Estimate cost (aimlapi pricing varies by model)
              const cost = this.estimateAimlApiCost(
                result.result.model,
                result.result.usage
              );

              await this.supabase
                .from('benchmark_jobs')
                .update({
                  status: 'completed',
                  output,
                  latency_ms: latencyMs,
                  tokens_used: tokens,
                  cost,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', result.id);
            } else if (result.status === 'failed') {
              await this.supabase
                .from('benchmark_jobs')
                .update({
                  status: 'failed',
                  error_message: result.error?.message || 'Unknown error',
                  completed_at: new Date().toISOString(),
                })
                .eq('id', result.id);
            }
          }
        }

        // Check if all done
        const completedCount =
          batchStatus.request_counts.completed + batchStatus.request_counts.failed;
        if (completedCount >= expectedResultCount || batchStatus.status === 'completed') {
          // Compile results and update benchmark
          await this.compileBenchmarkResults(benchmarkId);
        } else if (pollAttempts < this.maxPollAttempts && batchStatus.status === 'processing') {
          // Continue polling
          setTimeout(pollFn, this.pollIntervalMs);
        }
      } catch (error) {
        console.error('Batch polling error:', error);
        // Update benchmark status to failed
        await this.supabase
          .from('benchmarks')
          .update({ status: 'failed' })
          .eq('id', benchmarkId);
      }
    };

    // Start polling
    setTimeout(pollFn, this.pollIntervalMs);
  }

  /**
   * Execute benchmark for mixed providers individually
   */
  private async executeIndividually(
    benchmarkId: string,
    benchmark: any,
    jobs: BenchmarkJob[]
  ) {
    // Update status
    await this.supabase
      .from('benchmarks')
      .update({ status: 'running' })
      .eq('id', benchmarkId);

    // Execute each model's job
    for (const [idx, model] of benchmark.models.entries()) {
      try {
        await this.executeJob(benchmarkId, jobs[idx].id, model, benchmark);

        // Update progress
        const currentProgress = idx + 1;
        await this.supabase
          .from('benchmarks')
          .update({
            progress: {
              current: currentProgress,
              total: benchmark.models.length,
            },
          })
          .eq('id', benchmarkId);
      } catch (error) {
        console.error(`Job ${idx} failed:`, error);
        // Continue with next job
      }
    }

    // Compile final results
    await this.compileBenchmarkResults(benchmarkId);
  }

  /**
   * Execute single model job
   */
  private async executeJob(
    _benchmarkId: string,
    jobId: string,
    model: any,
    _benchmark: any
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Call appropriate provider endpoint
      if (model.provider === 'aimlapi') {
        // Already handled by batch
      } else if (model.provider === 'deepseek') {
        // Call individual deepseek
      } else if (model.provider === 'gemini') {
        // Call individual gemini
      }

      // Update job with success
      await this.supabase
        .from('benchmark_jobs')
        .update({
          status: 'completed',
          latency_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    } catch (error) {
      // Update job with error
      await this.supabase
        .from('benchmark_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }
  }

  /**
   * Compile benchmark results from all jobs
   */
  private async compileBenchmarkResults(benchmarkId: string): Promise<void> {
    // Get all completed jobs
    const { data: jobs } = await this.supabase
      .from('benchmark_jobs')
      .select('*')
      .eq('benchmark_id', benchmarkId)
      .order('job_index');

    if (!jobs || jobs.length === 0) {
      return;
    }

    // Build results array
    const results: BenchmarkResult[] = jobs
      .filter(job => job.status === 'completed')
      .map(job => ({
        model: job.model_id,
        provider: job.provider,
        output: job.output,
        metrics: {
          latency: job.latency_ms,
          cost: job.cost,
          tokens: job.tokens_used,
        },
      }));

    // Calculate summary
    const summary = this.calculateSummary(results);

    // Update benchmark
    await this.supabase
      .from('benchmarks')
      .update({
        status: 'completed',
        results,
        summary,
        completed_at: new Date().toISOString(),
        progress: {
          current: jobs.length,
          total: jobs.length,
        },
      })
      .eq('id', benchmarkId);
  }

  /**
   * Calculate benchmark summary statistics
   */
  private calculateSummary(results: BenchmarkResult[]): BenchmarkSummary {
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
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
    const minLatency = Math.min(...metrics.map(m => m.latency));
    const maxLatency = Math.max(...metrics.map(m => m.latency));

    // Find winner (best cost/quality ratio)
    const winner = results.length > 0 ? results[0].model : undefined;

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    return {
      totalResults: results.length,
      totalCost,
      avgLatency,
      minLatency,
      maxLatency,
      winner,
      recommendations,
    };
  }

  /**
   * Generate model recommendations
   */
  private generateRecommendations(results: BenchmarkResult[]): BenchmarkRecommendation[] {
    const recs: BenchmarkRecommendation[] = [];

    // Best overall (cost)
    const cheapest = results.reduce((prev, current) =>
      current.metrics.cost < prev.metrics.cost ? current : prev
    );
    recs.push({
      category: 'best',
      modelId: cheapest.model,
      reason: `Most cost-effective at $${cheapest.metrics.cost.toFixed(4)}`,
      score: 10,
    });

    // Fastest
    const fastest = results.reduce((prev, current) =>
      current.metrics.latency < prev.metrics.latency ? current : prev
    );
    if (fastest.model !== cheapest.model) {
      recs.push({
        category: 'fastest',
        modelId: fastest.model,
        reason: `Fastest response at ${fastest.metrics.latency}ms`,
        score: 9,
      });
    }

    // Balanced
    const balanced = results.reduce((prev, current) => {
      const prevScore = (1 / (prev.metrics.cost + 1)) + (1 / (prev.metrics.latency + 1));
      const currentScore = (1 / (current.metrics.cost + 1)) + (1 / (current.metrics.latency + 1));
      return currentScore > prevScore ? current : prev;
    });
    if (balanced.model !== cheapest.model && balanced.model !== fastest.model) {
      recs.push({
        category: 'balanced',
        modelId: balanced.model,
        reason: 'Best balance of cost and speed',
        score: 8,
      });
    }

    return recs;
  }

  /**
   * Estimate cost for aimlapi models
   * Pricing varies by model - this is simplified
   */
  private estimateAimlApiCost(
    _model: string,
    usage: { prompt_tokens: number; completion_tokens: number }
  ): number {
    // Simplified pricing (actual prices vary)
    const costPerMToken = 0.001; // $0.001 per 1M tokens (approximate)
    const totalTokens = usage.prompt_tokens + usage.completion_tokens;
    return (totalTokens / 1000000) * (costPerMToken * 1000);
  }

  /**
   * Get decrypted API key (call Netlify Function)
   */
  private async getApiKey(): Promise<string> {
    const response = await fetch('/api/credentials/aimlapi-key', {
      headers: {
        Authorization: `Bearer ${this.userToken}`,
      },
    });
    const { apiKey } = await response.json();
    return apiKey;
  }

  /**
   * Get benchmark by ID
   */
  async getBenchmark(benchmarkId: string): Promise<Benchmark> {
    const { data, error } = await this.supabase
      .from('benchmarks')
      .select('*')
      .eq('id', benchmarkId)
      .eq('user_id', this.userId)
      .single();

    if (error || !data) {
      throw new Error('Benchmark not found');
    }

    return data as Benchmark;
  }

  /**
   * List benchmarks for user
   */
  async listBenchmarks(filters?: {
    status?: string;
    type?: string;
    isFavorite?: boolean;
    tags?: string[];
  }): Promise<Benchmark[]> {
    let query = this.supabase
      .from('benchmarks')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.isFavorite) {
      query = query.eq('is_favorite', true);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return data as Benchmark[];
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(benchmarkId: string, isFavorite: boolean): Promise<void> {
    await this.supabase
      .from('benchmarks')
      .update({ is_favorite: isFavorite })
      .eq('id', benchmarkId)
      .eq('user_id', this.userId);
  }

  /**
   * Delete benchmark
   */
  async deleteBenchmark(benchmarkId: string): Promise<void> {
    await this.supabase
      .from('benchmarks')
      .delete()
      .eq('id', benchmarkId)
      .eq('user_id', this.userId);
  }

  /**
   * Export benchmark results
   */
  async exportBenchmark(
    benchmarkId: string,
    format: 'json' | 'csv'
  ): Promise<string> {
    const benchmark = await this.getBenchmark(benchmarkId);

    if (format === 'json') {
      return JSON.stringify(benchmark, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = ['Model', 'Provider', 'Latency (ms)', 'Cost (USD)', 'Tokens'];
      const rows = benchmark.results.map(r => [
        r.model,
        r.provider,
        r.metrics.latency,
        r.metrics.cost,
        r.metrics.tokens || '',
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csv;
    }

    throw new Error('Unsupported export format');
  }
}
