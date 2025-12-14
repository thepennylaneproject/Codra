/**
 * src/lib/ai/types-image.ts
 * Image generation interfaces extending Phase 4 AI types
 */

/**
 * Options for image generation requests
 */
export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  model: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  style?: string; // For style-specific models
  guidance?: number; // Guidance scale (7-20 typical)
  scheduler?: string; // 'euler', 'ddim', 'dpm', etc.
  webhookUrl?: string; // Callback on completion
}

/**
 * Result from a successful image generation
 */
export interface ImageGenerationResult {
  url: string; // Permanent Supabase URL
  model: string;
  provider: string;
  dimensions: {
    width: number;
    height: number;
  };
  cost: number;
  generationTime: number; // milliseconds
  metadata: {
    prompt: string;
    negativePrompt?: string;
    seed: number;
    revisedPrompt?: string; // OpenAI returns revised prompts
    steps?: number;
    guidance?: number;
  };
}

/**
 * Async job tracking for long-running generations
 */
export interface ImageGenerationJob {
  id: string;
  userId: string;
  workspaceId: string;
  provider: string;
  model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: ImageGenerationOptions;
  result?: ImageGenerationResult;
  error?: {
    code: string;
    message: string;
  };
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date; // For cleanup
  webhookUrl?: string;
  webhookDelivered?: boolean;
}

/**
 * Provider-specific capabilities
 */
export interface ImageModelCapabilities {
  id: string;
  provider: string;
  modelName: string;
  displayName: string;
  description: string;
  category: 'text2img' | 'img2img' | 'upscale' | 'style-transfer';
  capabilities: {
    supportsNegativePrompt: boolean;
    supportsSeed: boolean;
    supportsSteps: boolean;
    supportsGuidance: boolean;
    supportsStyle: boolean;
  };
  supportedDimensions: Array<{
    width: number;
    height: number;
    cost: number; // Cost for this dimension
  }>;
  avgGenerationTime: number; // milliseconds
  costPerGeneration: number;
  active: boolean;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
}

/**
 * Provider interface for image generation
 */
export interface IImageProvider {
  id: string;
  name: string;
  
  /**
   * Generate image synchronously (for fast models)
   */
  generate(
    options: ImageGenerationOptions,
    credentials: Record<string, string>
  ): Promise<ImageGenerationResult>;
  
  /**
   * Start async generation (returns job ID)
   */
  generateAsync(
    options: ImageGenerationOptions,
    credentials: Record<string, string>
  ): Promise<{ jobId: string; estimatedTime: number }>;
  
  /**
   * Check status of async job
   */
  getJobStatus(
    jobId: string,
    credentials: Record<string, string>
  ): Promise<ImageGenerationJob>;
  
  /**
   * List available models
   */
  listModels(
    credentials: Record<string, string>
  ): Promise<ImageModelCapabilities[]>;
  
  /**
   * Estimate cost before generation
   */
  estimateCost(model: string, width?: number, height?: number): Promise<number>;
  
  /**
   * Test provider connectivity
   */
  test(credentials: Record<string, string>): Promise<{ status: 'ok' | 'error'; message: string }>;
}

/**
 * Generation queue job record (matches Supabase schema)
 */
export interface GenerationJobRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  provider: string;
  model: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  style?: string;
  guidance?: number;
  image_url?: string;
  cost: number;
  generation_time?: number;
  revised_prompt?: string;
  retry_count: number;
  max_retries: number;
  error_code?: string;
  error_message?: string;
  webhook_url?: string;
  webhook_delivered: boolean;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
}

/**
 * Image model record (for caching available models)
 */
export interface ImageModelRecord {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
  description: string;
  category: 'text2img' | 'img2img' | 'upscale' | 'style-transfer';
  supports_negative_prompt: boolean;
  supports_seed: boolean;
  supports_steps: boolean;
  supports_guidance: boolean;
  supports_style: boolean;
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  recommended_width: number;
  recommended_height: number;
  avg_generation_time: number;
  cost_per_generation: number;
  active: boolean;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

/**
 * Cost estimation response
 */
export interface CostEstimate {
  model: string;
  provider: string;
  estimatedCost: number;
  estimatedTime: number; // milliseconds
  breakdown: {
    baseCost: number;
    dimensionMultiplier: number;
    qualityMultiplier: number;
  };
}

/**
 * Webhook payload for generation completion
 */
export interface GenerationWebhookPayload {
  jobId: string;
  status: 'completed' | 'failed';
  timestamp: string;
  result?: ImageGenerationResult;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Frontend request body for image generation
 */
export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  model: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  style?: string;
  guidance?: number;
  webhookUrl?: string;
  provider?: string; // If specified, use this provider only
}

/**
 * Frontend response for generation request
 */
export interface ImageGenerationResponse {
  jobId: string;
  status: 'completed' | 'pending';
  result?: ImageGenerationResult;
  estimatedWaitTime?: number; // milliseconds
  cost: number;
}

/**
 * Queue status for monitoring
 */
export interface QueueStatus {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgGenerationTime: number;
  estimatedWaitTime: number;
}
