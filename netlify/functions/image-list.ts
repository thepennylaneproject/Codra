/**
 * netlify/functions/image-list.ts
 * List image generation jobs for user or workspace
 */

interface ListQueryParams {
    userId?: string;
    workspaceId?: string;
    limit?: string;
    offset?: string;
    status?: string;
}

const listHandler: Handler = async (event, context) => {
    try {
        const authUserId = context.clientContext?.user?.sub;
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