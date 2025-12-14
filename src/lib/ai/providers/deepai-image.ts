/**
 * src/lib/ai/providers/deepai-image.ts
 * Image generation via DeepAI API
 * Supports: text2img, upscale, style transfer
 */

import {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageGenerationJob,
  ImageModelCapabilities,
  IImageProvider,
} from '../types-image';

interface DeepAIResponse {
  id: string;
  output?: string | string[]; // URL or array of URLs
  output_url?: string;
  status?: string;
  error?: string;
}

export class DeepAiImageProvider implements IImageProvider {
  id = 'deepai-image';
  name = 'DeepAI Image Generation';

  private baseUrl = 'https://api.deepai.org/api';

  private models: Record<string, { endpoint: string; costPerImage: number; avgTime: number }> = {
    'text2img': {
      endpoint: '/text2img',
      costPerImage: 0.002,
      avgTime: 5000,
    },
    'deepdream': {
      endpoint: '/deepdream',
      costPerImage: 0.003,
      avgTime: 4000,
    },
    'nsfw-checker': {
      endpoint: '/nsfw-checker',
      costPerImage: 0.001,
      avgTime: 2000,
    },
  };

  async generate(
    options: ImageGenerationOptions,
    credentials: Record<string, string>
  ): Promise<ImageGenerationResult> {
    const apiKey = credentials['deepai_key'];
    if (!apiKey) {
      throw new Error('DeepAI API key not found');
    }

    const modelConfig = this.models[options.model];
    if (!modelConfig) {
      throw new Error(`Model ${options.model} not supported by DeepAI`);
    }

    try {
      const formData = new FormData();
      formData.append('text', options.prompt);
      if (options.negativePrompt) {
        formData.append('negative_text', options.negativePrompt);
      }

      const response = await fetch(`${this.baseUrl}${modelConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json() as DeepAIResponse;
        throw new Error(
          error.error || `DeepAI error: ${response.statusText}`
        );
      }

      const data = await response.json() as DeepAIResponse;

      if (!data.output_url && !data.output) {
        throw new Error('DeepAI returned no image data');
      }

      const imageUrl = typeof data.output === 'string'
        ? data.output
        : Array.isArray(data.output)
          ? data.output[0]
          : data.output_url;

      if (!imageUrl) {
        throw new Error('Could not extract image URL from DeepAI response');
      }

      const startTime = Date.now();

      // Validate image
      await this.downloadImage(imageUrl);

      const result: ImageGenerationResult = {
        url: imageUrl, // Placeholder - will be replaced with Supabase URL
        model: options.model,
        provider: this.id,
        dimensions: {
          width: options.width || 512,
          height: options.height || 512,
        },
        cost: modelConfig.costPerImage,
        generationTime: Date.now() - startTime,
        metadata: {
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          seed: options.seed || Math.floor(Math.random() * 1000000),
        },
      };

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`DeepAI generation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async generateAsync(
    options: ImageGenerationOptions,
    _credentials: Record<string, string>
  ): Promise<{ jobId: string; estimatedTime: number }> {
    // DeepAI doesn't support async jobs through their standard API
    // Implement by storing as pending job
    const jobId = `deepai-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const modelConfig = this.models[options.model] || { avgTime: 5000 };

    return {
      jobId,
      estimatedTime: modelConfig.avgTime,
    };
  }

  async getJobStatus(
    _jobId: string,
    _credentials: Record<string, string>
  ): Promise<ImageGenerationJob> {
    // DeepAI doesn't support job querying
    // This is handled by the queue manager in the Netlify function
    throw new Error('DeepAI does not support async job status queries');
  }

  async listModels(
    credentials: Record<string, string>
  ): Promise<ImageModelCapabilities[]> {
    const apiKey = credentials['deepai_key'];
    if (!apiKey) {
      throw new Error('DeepAI API key not found');
    }

    return [
      {
        id: 'text2img',
        provider: 'deepai',
        modelName: 'text2img',
        displayName: 'Text to Image',
        description: 'Fast, affordable text-to-image generation',
        category: 'text2img',
        capabilities: {
          supportsNegativePrompt: true,
          supportsSeed: false,
          supportsSteps: false,
          supportsGuidance: false,
          supportsStyle: false,
        },
        supportedDimensions: [
          { width: 512, height: 512, cost: 0.002 },
          { width: 768, height: 768, cost: 0.002 },
        ],
        avgGenerationTime: 5000,
        costPerGeneration: 0.002,
        active: true,
        tier: 'free',
      },
      {
        id: 'deepdream',
        provider: 'deepai',
        modelName: 'deepdream',
        displayName: 'Deep Dream',
        description: 'Artistic dream-like image generation',
        category: 'text2img',
        capabilities: {
          supportsNegativePrompt: false,
          supportsSeed: false,
          supportsSteps: false,
          supportsGuidance: false,
          supportsStyle: true,
        },
        supportedDimensions: [
          { width: 512, height: 512, cost: 0.003 },
        ],
        avgGenerationTime: 4000,
        costPerGeneration: 0.003,
        active: true,
        tier: 'free',
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

    return modelConfig.costPerImage;
  }

  async test(
    credentials: Record<string, string>
  ): Promise<{ status: 'ok' | 'error'; message: string }> {
    const apiKey = credentials['deepai_key'];
    if (!apiKey) {
      return {
        status: 'error',
        message: 'No API key provided',
      };
    }

    try {
      const formData = new FormData();
      formData.append('text', 'a white square');

      const response = await fetch(`${this.baseUrl}/text2img`, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
        },
        body: formData,
      });

      if (response.ok || response.status === 400) {
        return {
          status: 'ok',
          message: 'DeepAI API key is valid',
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

export const deepAiImageProvider = new DeepAiImageProvider();
