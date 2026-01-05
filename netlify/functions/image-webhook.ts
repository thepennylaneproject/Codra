/**
 * netlify/functions/image-webhook.ts
 * Receive webhooks from async image providers
 */

import { Handler } from '@netlify/functions';
import { ImageGeneratorQueue } from '../../src/lib/ai/queue/generator-queue';

const queue = new ImageGeneratorQueue(new Map());

interface WebhookPayload {
    task_id?: string;
    job_id?: string;
    status: 'COMPLETED' | 'FAILED';
    result?: {
        image: string;
        final_prompt?: string;
        seed?: number;
    };
    error?: string;
}

const webhookHandler: Handler = async (event) => {
    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: 'Method not allowed' }),
            };
        }

        const payload = JSON.parse(event.body || '{}') as WebhookPayload;
        const jobId = payload.job_id || payload.task_id;

        if (!jobId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Job ID required in payload' }),
            };
        }

        const job = await queue.getJob(jobId);
        if (!job) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Job not found' }),
            };
        }

        if (payload.status === 'COMPLETED' && payload.result?.image) {
            // Update job with result
            const result = {
                url: payload.result.image,
                model: job.model,
                provider: job.provider,
                dimensions: {
                    width: job.options.width || 1024,
                    height: job.options.height || 1024,
                },
                cost: 0,
                generationTime: job.completedAt
                    ? new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()
                    : 0,
                metadata: {
                    prompt: job.options.prompt,
                    negativePrompt: job.options.negativePrompt,
                    seed: payload.result.seed || 0,
                    revisedPrompt: payload.result.final_prompt,
                },
            };

            await queue.setJobResult(jobId, result, job.options.model ? 0.01 : 0);
        } else if (payload.status === 'FAILED') {
            await queue.setJobError(jobId, 'provider_error', payload.error || 'Generation failed');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true }),
        };
    } catch (error) {
        console.error('Webhook error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};

export const handler = webhookHandler;
