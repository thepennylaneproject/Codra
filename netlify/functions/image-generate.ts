/**
 * netlify/functions/image-generate.ts
 * Generate new images or check/retry existing jobs
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { AimlApiImageProvider } from '../../src/lib/ai/providers/aimlapi-image';
import { DeepAiImageProvider } from '../../src/lib/ai/providers/deepai-image';
import { ImageGeneratorQueue } from '../../src/lib/ai/queue/generator-queue';
import { ImageStorage } from '../../src/lib/ai/storage/image-storage';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  IImageProvider,
} from '../../src/lib/ai/types-image';

// Initialize providers
const providers = new Map<string, IImageProvider>([
  ['aimlapi-image', new AimlApiImageProvider()],
  ['deepai-image', new DeepAiImageProvider()],
]);

const queue = new ImageGeneratorQueue(providers);
const storage = new ImageStorage();

interface RequestBody {
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
  webhookUrl?: string;
  provider?: string;
  retryJobId?: string; // For retrying failed jobs
}

const handler: Handler = async (event, context) => {
  try {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' }),
      };
    }

    const body = JSON.parse(event.body || '{}') as RequestBody;

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side key
    );

    // Verify authentication
    let userId = context.clientContext?.user?.sub;

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    // Get workspace from header
    const workspaceId = event.headers['x-workspace-id'] || 'default';

    // Handle retry request
    if (body.retryJobId) {
      const job = await queue.getJob(body.retryJobId);
      if (!job || job.status !== 'failed') {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Job not found or not failed' }),
        };
      }

      if (job.retryCount >= job.maxRetries) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Max retries exceeded' }),
        };
      }

      const retriedJob = await queue.retryJob(body.retryJobId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          jobId: retriedJob.id,
          status: 'pending',
          cost: 0,
        } as ImageGenerationResponse),
      };
    }

    // Validate request
    if (!body.prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Prompt is required' }),
      };
    }

    if (!body.model) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Model is required' }),
      };
    }

    // Get user credentials
    const { data: credentialData, error: credError } = await supabase
      .from('api_credentials')
      .select('provider, encrypted_key')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (credError || !credentialData?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No API credentials configured' }),
      };
    }

    // Decrypt credentials server-side
    const decryptedCredentials = await Promise.all(
      credentialData.map(async cred => {
        // In production, use proper encryption library
        // For now, assuming credentials are stored encrypted in Supabase
        return {
          provider: cred.provider,
          key: cred.encrypted_key, // Would be decrypted here
        };
      })
    );

    const credentials: Record<string, string> = {};
    for (const cred of decryptedCredentials) {
      credentials[`${cred.provider}_key`] = cred.key;
    }

    // Determine provider (default: aimlapi if available)
    let providerName = body.provider || 'aimlapi-image';
    if (body.model === 'text2img' || body.model === 'deepdream') {
      providerName = 'deepai-image';
    }

    const provider = providers.get(providerName);
    if (!provider) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Provider not supported: ${providerName}` }),
      };
    }

    // Estimate cost
    const estimatedCost = await provider.estimateCost(
      body.model,
      body.width,
      body.height
    );

    // Check user budget (from usage table)
    const { data: usage } = await supabase
      .from('usage_logs')
      .select('cost')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const monthlySpent = usage?.reduce((sum, u) => sum + (u.cost || 0), 0) || 0;
    const monthlyBudget = 100; // Default budget, should come from user settings

    if (monthlySpent + estimatedCost > monthlyBudget) {
      return {
        statusCode: 402,
        body: JSON.stringify({
          message: 'Monthly budget exceeded',
          spent: monthlySpent,
          budget: monthlyBudget,
          estimatedCost,
        }),
      };
    }

    // Create job
    const job = await queue.createJob(userId, workspaceId, providerName, body.model, {
      prompt: body.prompt,
      negativePrompt: body.negativePrompt,
      model: body.model,
      width: body.width || 1024,
      height: body.height || 1024,
      steps: body.steps,
      guidance: body.guidance,
      seed: body.seed,
      webhookUrl: body.webhookUrl,
    });

    // Try fast generation first (sync)
    try {
      const startTime = Date.now();

      const result = await provider.generate(
        {
          prompt: body.prompt,
          negativePrompt: body.negativePrompt,
          model: body.model,
          width: body.width || 1024,
          height: body.height || 1024,
          steps: body.steps,
          guidance: body.guidance,
          seed: body.seed,
        },
        credentials
      );

      // Upload to Supabase Storage
      const supabaseUrl = await storage.uploadImage(
        job.id,
        userId,
        result.url,
        body.prompt
      );

      // Update job with result
      await queue.setJobResult(job.id, { ...result, url: supabaseUrl }, estimatedCost);

      // Log usage
      await supabase.from('usage_logs').insert([
        {
          user_id: userId,
          workspace_id: workspaceId,
          provider: providerName,
          model: body.model,
          cost: estimatedCost,
          tokens: 0,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Deliver webhook if provided
      const updatedJob = await queue.getJob(job.id);
      if (updatedJob && body.webhookUrl) {
        queue.deliverWebhook(updatedJob);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          jobId: job.id,
          status: 'completed',
          result: { ...result, url: supabaseUrl },
          cost: estimatedCost,
        } as ImageGenerationResponse),
      };
    } catch (syncError) {
      console.log('Sync generation failed, queuing for async:', syncError);

      // Fall back to async generation
      try {
        const { jobId: asyncJobId, estimatedTime } = await provider.generateAsync(
          {
            prompt: body.prompt,
            negativePrompt: body.negativePrompt,
            model: body.model,
            width: body.width || 1024,
            height: body.height || 1024,
            steps: body.steps,
            guidance: body.guidance,
            seed: body.seed,
          },
          credentials
        );

        // Update job with async task ID
        await queue.updateJobStatus(job.id, 'processing');

        return {
          statusCode: 202,
          body: JSON.stringify({
            jobId: job.id,
            status: 'pending',
            estimatedWaitTime: estimatedTime,
            cost: estimatedCost,
          } as ImageGenerationResponse),
        };
      } catch (asyncError) {
        const errorMessage = asyncError instanceof Error ? asyncError.message : 'Generation failed';
        await queue.setJobError(job.id, 'generation_failed', errorMessage);

        return {
          statusCode: 500,
          body: JSON.stringify({
            message: 'Image generation failed',
            error: errorMessage,
          }),
        };
      }
    }
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
