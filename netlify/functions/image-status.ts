/**
 * netlify/functions/image-status.ts
 * Get status of a specific image generation job
 */

import { Handler } from '@netlify/functions';
import { ImageGeneratorQueue } from '../../src/lib/ai/queue/generator-queue';
import { Map as ProviderMap } from '../../src/lib/ai/types-image';

const queue = new ImageGeneratorQueue(new Map());

interface StatusResponse {
  job?: any;
  message?: string;
}

const statusHandler: Handler = async (event, context) => {
  try {
    const jobId = event.path.split('/').pop();

    if (!jobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Job ID required' }),
      };
    }

    const userId = context.clientContext?.user?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Job not found' }),
      };
    }

    // Verify ownership
    if (job.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Forbidden' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ job } as StatusResponse),
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};



