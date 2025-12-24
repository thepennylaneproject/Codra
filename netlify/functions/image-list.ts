/**
 * netlify/functions/image-list.ts
 * List image generation jobs for user or workspace
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { ImageGeneratorQueue } from '../../src/lib/ai/queue/generator-queue';

const queue = new ImageGeneratorQueue(new Map());

interface ListQueryParams {
    userId?: string;
    workspaceId?: string;
    limit?: string;
    offset?: string;
    status?: string;
}

const listHandler: Handler = async (event, context) => {
    try {
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify authentication
        let authUserId = context.clientContext?.user?.sub;

        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                authUserId = user.id;
            }
        }

        if (!authUserId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        const params = event.queryStringParameters as Partial<ListQueryParams> | null;
        const userId = params?.userId || authUserId;
        const limit = parseInt(params?.limit || '50', 10);
        const offset = parseInt(params?.offset || '0', 10);

        // Verify user can access this data
        if (userId !== authUserId) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Forbidden' }),
            };
        }

        const jobs = await queue.getUserJobs(userId, limit, offset);
        const queueStatus = await queue.getQueueStatus();

        return {
            statusCode: 200,
            body: JSON.stringify({
                jobs,
                queueStatus,
                pagination: { limit, offset, total: jobs.length },
            }),
        };
    } catch (error) {
        console.error('List error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};

export const handler = listHandler;