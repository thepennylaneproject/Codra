/**
 * src/lib/ai/providers/aimlapi-image.ts
 * Image generation via aimlapi.com unified gateway
 * Supports: DALL-E 3, Flux Pro, Stable Diffusion XL
 */

import {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageGenerationJob,
  ImageModelCapabilities,
  IImageProvider,

} from '../types-image';

interface AimlApiImageResponse {
  status: 'success' | 'error';
  task_id?: string;
  result?: {
    image: string;
    final_prompt?: string;
    seed?: number;
  };
  error?: string;
  error_description?: string;
}

interface AimlApiJobStatus {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  task_id: string;
  result?: {
    image: string;
    final_prompt?: string;
    seed?: number;
  };
  error?: string;
}

export class AimlApiImageProvider implements IImageProvider {
  id = 'aimlapi-image';
  name = 'aimlapi.com Image Generation';

  private baseUrl = 'https://api.aimlapi.com';

  // Model configurations
  private models: Record<string, { endpoint: string; costPerImage: number; avgTime: number }> = {
    'dall-e-3': {
      endpoint: '/generate/dall-e-3',
      costPerImage: 0.020,
      avgTime: 8000,
    },
    'flux-pro': {
      endpoint: '/generate/flux-pro',
      costPerImage: 0.014,
      avgTime: 15000,
    },
    'stable-diffusion-xl': {
      endpoint: '/generate/stable-diffusion-xl',
      costPerImage: 0.004,
      avgTime: 6000,
    },
    'stable-diffusion-3': {
      endpoint: '/generate/stable-diffusion-3',
      costPerImage: 0.006,
      avgTime: 10000,
    },
  };

  async generate(
    options: ImageGenerationOptions,
    credentials: Record<string, string>
  ): Promise<ImageGenerationResult> {
    const apiKey = credentials['aimlapi_key'];
    if (!apiKey) {
      throw new Error('aimlapi.com API key not found');
    }

    const modelConfig = this.models[options.model];
    if (!modelConfig) {
      throw new Error(`Model ${options.model} not supported by aimlapi`);
    }

    const payload = this.buildRequestPayload(options);

    try {
      const response = await fetch(`${this.baseUrl}${modelConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json() as AimlApiImageResponse;
        throw new Error(
          `aimlapi error: ${error.error_description || error.error || 'Unknown error'}`
        );
      }

      const data = await response.json() as AimlApiImageResponse;

      if (data.status === 'error') {
        throw new Error(`aimlapi error: ${data.error_description || data.error}`);
      }

      if (!data.result?.image) {
        throw new Error('aimlapi returned no image data');
      }

      const startTime = Date.now();

      // Download and validate image
      await this.downloadImage(data.result.image);

      const result: ImageGenerationResult = {
        url: data.result.image, // Placeholder - will be replaced with Supabase URL
        model: options.model,
        provider: this.id,
        dimensions: {
          width: options.width || 1024,
          height: options.height || 1024,
        },
        cost: modelConfig.costPerImage,
        generationTime: Date.now() - startTime,
        metadata: {
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          seed: data.result.seed || Math.floor(Math.random() * 1000000),
          revisedPrompt: data.result.final_prompt,
          steps: options.steps,
          guidance: options.guidance,
        },
      };

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`aimlapi generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async generateAsync(
    options: ImageGenerationOptions,
    credentials: Record<string, string>
  ): Promise<{ jobId: string; estimatedTime: number }> {
    const apiKey = credentials['aimlapi_key'];
    if (!apiKey) {
      throw new Error('aimlapi.com API key not found');
    }

    const modelConfig = this.models[options.model];
    if (!modelConfig) {
      throw new Error(`Model ${options.model} not supported by aimlapi`);
    }

    const payload = {
      ...this.buildRequestPayload(options),
      async: true, // Request async processing
    };

    try {
      const response = await fetch(`${this.baseUrl}${modelConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json() as AimlApiImageResponse;
        throw new Error(
          `aimlapi error: ${error.error_description || error.error || 'Unknown error'}`
        );
      }

      const data = await response.json() as AimlApiImageResponse;

      if (!data.task_id) {
        throw new Error('aimlapi did not return task_id for async generation');
      }

      return {
        jobId: data.task_id,
        estimatedTime: modelConfig.avgTime,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`aimlapi async generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getJobStatus(
    jobId: string,
    credentials: Record<string, string>
  ): Promise<ImageGenerationJob> {
    const apiKey = credentials['aimlapi_key'];
    if (!apiKey) {
      throw new Error('aimlapi.com API key not found');
    }

    try {
      const response = await fetch(`${this.baseUrl}/task/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.statusText}`);
      }

      const data = await response.json() as AimlApiJobStatus;

      const status = data.status === 'PROCESSING'
        ? 'processing'
        : data.status === 'COMPLETED'
          ? 'completed'
          : 'failed';

      const job: ImageGenerationJob = {
        id: jobId,
        userId: '', // Will be set by queue manager
        workspaceId: '', // Will be set by queue manager
        provider: this.id,
        model: '', // Will be set by queue manager
        status,
        options: {} as ImageGenerationOptions,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      };

      if (data.status === 'COMPLETED' && data.result?.image) {
        job.result = {
          url: data.result.image,
          model: '',
          provider: this.id,
          dimensions: { width: 1024, height: 1024 },
          cost: 0,
          generationTime: 0,
          metadata: {
            prompt: '',
            seed: data.result.seed || 0,
            revisedPrompt: data.result.final_prompt,
          },
        };
        job.completedAt = new Date();
      } else if (data.status === 'FAILED') {
        job.error = {
          code: 'generation_failed',
          message: data.error || 'Generation failed',
        };
      }

      return job;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to check job status: ${error.message}`);
      }
      throw error;
    }
  }

  async listModels(
    credentials: Record<string, string>
  ): Promise<ImageModelCapabilities[]> {
    const apiKey = credentials['aimlapi_key'];
    if (!apiKey) {
      throw new Error('aimlapi.com API key not found');
    }

    return [
      {
        id: 'dall-e-3',
        provider: 'aimlapi',
        modelName: 'dall-e-3',
        displayName: 'DALL-E 3',
        description: 'Advanced text-to-image generation with improved realism and detail',
        category: 'text2img',
        capabilities: {
          supportsNegativePrompt: false,
          supportsSeed: true,
          supportsSteps: false,
          supportsGuidance: false,
          supportsStyle: false,
        },
        supportedDimensions: [
          { width: 1024, height: 1024, cost: 0.020 },
          { width: 1792, height: 1024, cost: 0.020 },
          { width: 1024, height: 1792, cost: 0.020 },
        ],
        avgGenerationTime: 8000,
        costPerGeneration: 0.020,
        active: true,
        tier: 'pro',
      },
      {
        id: 'flux-pro',
        provider: 'aimlapi',
        modelName: 'flux-pro',
        displayName: 'Flux Pro',
        description: 'High-quality diffusion model with fast generation and consistent results',
        category: 'text2img',
        capabilities: {
          supportsNegativePrompt: true,
          supportsSeed: true,
          supportsSteps: true,
          supportsGuidance: true,
          supportsStyle: true,
        },
        supportedDimensions: [
          { width: 512, height: 512, cost: 0.014 },
          { width: 768, height: 768, cost: 0.014 },
          { width: 1024, height: 1024, cost: 0.014 },
          { width: 1440, height: 912, cost: 0.014 },
        ],
        avgGenerationTime: 15000,
        costPerGeneration: 0.014,
        active: true,
        tier: 'pro',
      },
      {
        id: 'stable-diffusion-xl',
        provider: 'aimlapi',
        modelName: 'stable-diffusion-xl',
        displayName: 'Stable Diffusion XL',
        description: 'Open-source SDXL with excellent quality and fast inference',
        category: 'text2img',
        capabilities: {
          supportsNegativePrompt: true,
          supportsSeed: true,
          supportsSteps: true,
          supportsGuidance: true,
          supportsStyle: false,
        },
        supportedDimensions: [
          { width: 512, height: 512, cost: 0.004 },
          { width: 768, height: 768, cost: 0.004 },
          { width: 1024, height: 1024, cost: 0.004 },
        ],
        avgGenerationTime: 6000,
        costPerGeneration: 0.004,
        active: true,
        tier: 'basic',
      },
      {
        id: 'stable-diffusion-3',
        provider: 'aimlapi',
        modelName: 'stable-diffusion-3',
        displayName: 'Stable Diffusion 3',
        description: 'Latest SDXL with improved text handling and realism',
        category: 'text2img',
        capabilities: {
          supportsNegativePrompt: true,
          supportsSeed: true,
          supportsSteps: true,
          supportsGuidance: true,
          supportsStyle: false,
        },
        supportedDimensions: [
          { width: 512, height: 512, cost: 0.006 },
          { width: 768, height: 768, cost: 0.006 },
          { width: 1024, height: 1024, cost: 0.006 },
        ],
        avgGenerationTime: 10000,
        costPerGeneration: 0.006,
        active: true,
        tier: 'basic',
      },
    ];
  }

  async estimateCost(
    model: string,
    _width?: number,
    _height?: number
  ): Promise<number> {
    const modelConfig = this.models[model];
    if (!modelConfig) {
      throw new Error(`Model ${model} not supported`);
    }

    // Cost is primarily per image; dimension multipliers are minimal
    return modelConfig.costPerImage;
  }

  async test(
    credentials: Record<string, string>
  ): Promise<{ status: 'ok' | 'error'; message: string }> {
    const apiKey = credentials['aimlapi_key'];
    if (!apiKey) {
      return {
        status: 'error',
        message: 'No API key provided',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/generate/dall-e-3`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'a white square on a white background',
          size: '512x512',
        }),
      });

      if (response.ok || response.status === 400) {
        // 400 means API responded (credential is valid)
        return {
          status: 'ok',
          message: 'aimlapi.com API key is valid',
        };
      }

      return {
        status: 'error',
        message: `API test failed with status ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Helper: Build request payload for aimlapi
   */
  private buildRequestPayload(options: ImageGenerationOptions): Record<string, any> {
    return {
      prompt: options.prompt,
      negative_prompt: options.negativePrompt || undefined,
      size: options.width && options.height
        ? `${options.width}x${options.height}`
        : '1024x1024',
      steps: options.steps || 30,
      guidance_scale: options.guidance || 7.5,
      seed: options.seed,
      style: options.style || undefined,
      quality: 'hd',
    };
  }

  /**
   * Helper: Download image from URL to validate it exists
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image download failed: ${error.message}`);
      }
      throw error;
    }
  }
}

export const aimlApiImageProvider = new AimlApiImageProvider();
