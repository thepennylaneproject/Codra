// src/lib/ai/types-benchmark.ts
/**
 * Type definitions for Model Benchmarking Panel (Phase 6)
 * Includes interfaces for benchmark configuration, results, and job tracking
 */

// ============================================================================
// BENCHMARK CONFIGURATION
// ============================================================================

export interface BenchmarkModel {
  id: string;
  name: string;
  provider: 'aimlapi' | 'deepseek' | 'gemini' | 'deepai' | 'openai' | 'anthropic';
  category?: 'text' | 'image';
  costPerToken?: number;
  avgLatency?: number; // Historical avg latency in ms
}

export interface BenchmarkConfig {
  prompt: string;
  models: BenchmarkModel[];
  type: 'text' | 'image';
  iterations?: number; // 1-5, default 1
  parameters?: BenchmarkParameters;
}

export interface BenchmarkParameters {
  // For text
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  
  // For image
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidance?: number;
}

// ============================================================================
// BENCHMARK EXECUTION
// ============================================================================

export interface BenchmarkJob {
  id: string;
  benchmarkId: string;
  jobIndex: number; // Which model in the list (0-indexed)
  modelId: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  batchRequestId?: string; // For aimlapi batch processing
  output?: string | ImageGenerationResult;
  latencyMs?: number;
  tokensUsed?: number;
  cost?: number;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface BenchmarkJobUpdate {
  status: 'completed' | 'failed';
  output?: string | ImageGenerationResult;
  latencyMs?: number;
  tokensUsed?: number;
  cost?: number;
  errorMessage?: string;
}

// ============================================================================
// BENCHMARK RESULTS
// ============================================================================

export interface BenchmarkResult {
  model: string;
  provider: string;
  output: string | ImageGenerationResult;
  metrics: BenchmarkMetrics;
}

export interface BenchmarkMetrics {
  latency: number; // milliseconds
  cost: number; // USD
  tokens?: number; // For text models
}

export interface BenchmarkSummary {
  totalResults: number;
  totalCost: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  winner?: string; // Model ID with best cost/quality ratio
  recommendations: BenchmarkRecommendation[];
}

export interface BenchmarkRecommendation {
  category: 'best' | 'balanced' | 'budget' | 'fastest';
  modelId: string;
  reason: string;
  score: number;
}

// ============================================================================
// BENCHMARK STORAGE
// ============================================================================

export interface Benchmark {
  id: string;
  userId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  prompt: string;
  type: 'text' | 'image';
  models: BenchmarkModel[];
  parameters?: BenchmarkParameters;
  iterations: number;
  
  // Execution
  status: 'draft' | 'queued' | 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
  };
  
  // Results
  results: BenchmarkResult[];
  summary?: BenchmarkSummary;
  
  // Metadata
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface BenchmarkHistory {
  id: string;
  benchmarkId: string;
  snapshot: Benchmark;
  versionNumber: number;
  createdAt: Date;
}

export interface BenchmarkFavorite {
  id: string;
  benchmarkId: string;
  notes?: string;
  createdAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateBenchmarkRequest {
  name: string;
  description?: string;
  prompt: string;
  type: 'text' | 'image';
  models: string[]; // Model IDs
  parameters?: BenchmarkParameters;
  iterations?: number;
}

export interface CreateBenchmarkResponse {
  success: boolean;
  benchmarkId?: string;
  error?: string;
}

export interface StartBenchmarkRequest {
  benchmarkId: string;
}

export interface StartBenchmarkResponse {
  success: boolean;
  message: string;
  batchId?: string; // For batch operations
  error?: string;
}

export interface GetBenchmarkResponse {
  success: boolean;
  benchmark?: Benchmark;
  error?: string;
}

export interface ListBenchmarksResponse {
  success: boolean;
  benchmarks: Benchmark[];
  total: number;
  error?: string;
}

export interface BenchmarkStatusResponse {
  success: boolean;
  benchmarkId: string;
  status: 'draft' | 'queued' | 'running' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
  };
  resultsAvailable: number;
  error?: string;
}

// ============================================================================
// BATCH PROCESSING (aimlapi)
// ============================================================================

/**
 * aimlapi Batch API Integration
 * https://api.aimlapi.com/docs#batch-processing
 * 
 * Benefits:
 * - 50% cost savings on batch requests
 * - Processes multiple requests in one API call
 * - Returns results in order
 */

export interface AimlApiBatchRequest {
  requests: AimlApiBatchItem[];
}

export interface AimlApiBatchItem {
  id: string; // Unique ID within batch (benchmark_job_id)
  method: string; // "POST"
  url: string; // "/v1/chat/completions"
  headers: Record<string, string>;
  body: {
    model: string;
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  };
}

export interface AimlApiBatchResponse {
  request_id: string; // Batch request ID to poll
  status: 'accepted' | 'processing' | 'completed' | 'failed';
  created_at: string;
  request_counts: {
    total: number;
    completed: number;
    failed: number;
  };
}

export interface AimlApiBatchStatus {
  request_id: string;
  status: 'accepted' | 'processing' | 'completed' | 'failed';
  request_counts: {
    total: number;
    completed: number;
    failed: number;
  };
  results?: AimlApiBatchResultItem[];
}

export interface AimlApiBatchResultItem {
  id: string; // Matches the ID from the request
  status: 'success' | 'failed';
  result?: {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  error?: {
    type: string;
    message: string;
    code?: string;
  };
}

// ============================================================================
// IMAGE GENERATION TYPES (for reference)
// ============================================================================

export interface ImageGenerationResult {
  url: string;
  model: string;
  provider: string;
  dimensions: {
    width: number;
    height: number;
  };
  generationTime: number;
  metadata: {
    prompt: string;
    seed?: number;
    revisedPrompt?: string;
  };
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportBenchmarkRequest {
  benchmarkId: string;
  format: 'json' | 'csv';
}

export interface ExportBenchmarkResponse {
  success: boolean;
  url?: string; // Download URL
  error?: string;
}

// ============================================================================
// ANALYTICS / INSIGHTS
// ============================================================================

export interface ModelPerformanceMetrics {
  modelId: string;
  provider: string;
  totalRuns: number;
  avgLatency: number;
  avgCost: number;
  successRate: number; // 0-100%
  historicalRanking: 'best' | 'good' | 'average' | 'slow';
}

export interface BenchmarkInsights {
  bestModel: string;
  fastestModel: string;
  cheapestModel: string;
  qualityVsCostRatio: Array<{
    modelId: string;
    score: number;
  }>;
  suggestions: string[];
}
