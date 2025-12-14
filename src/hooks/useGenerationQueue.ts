/**
 * src/hooks/useGenerationQueue.ts
 * React hook for monitoring generation queue
 */

import { useEffect, useState, useCallback } from 'react';
import { ImageGenerationJob, QueueStatus } from '@/lib/ai/types-image';

interface UseGenerationQueueState {
    jobs: ImageGenerationJob[];
    queueStatus: QueueStatus | null;
    isLoading: boolean;
    error: string | null;
}

export function useGenerationQueue(userId?: string) {
    const [state, setState] = useState<UseGenerationQueueState>({
        jobs: [],
        queueStatus: null,
        isLoading: true,
        error: null,
    });

    // Load initial jobs
    useEffect(() => {
        const loadJobs = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));

                const endpoint = userId
                    ? `/.netlify/functions/image-list?userId=${userId}`
                    : '/.netlify/functions/image-list';

                const response = await fetch(endpoint);

                if (!response.ok) {
                    throw new Error(`Failed to load jobs: ${response.statusText}`);
                }

                const data = await response.json();

                setState(prev => ({
                    ...prev,
                    jobs: data.jobs || [],
                    queueStatus: data.queueStatus || null,
                    isLoading: false,
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: errorMessage,
                }));
            }
        };

        loadJobs();

        // Poll for updates every 2 seconds
        const interval = setInterval(loadJobs, 2000);

        return () => clearInterval(interval);
    }, [userId]);

    // Check individual job status
    const checkJobStatus = useCallback(
        async (jobId: string): Promise<ImageGenerationJob | null> => {
            try {
                const response = await fetch(`/.netlify/functions/image-status/${jobId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        return null;
                    }
                    throw new Error(`Failed to check status: ${response.statusText}`);
                }

                const data = await response.json();
                const job = data.job as ImageGenerationJob;

                // Update local state
                setState(prev => ({
                    ...prev,
                    jobs: prev.jobs.map(j => (j.id === jobId ? job : j)),
                }));

                return job;
            } catch (err) {
                console.error('Failed to check job status:', err);
                return null;
            }
        },
        []
    );

    // Retry failed job
    const retryJob = useCallback(
        async (jobId: string): Promise<ImageGenerationJob | null> => {
            try {
                const response = await fetch('/.netlify/functions/image-generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ retryJobId: jobId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to retry job');
                }

                const data = await response.json();
                return data.job || null;
            } catch (err) {
                console.error('Failed to retry job:', err);
                return null;
            }
        },
        []
    );

    return {
        ...state,
        checkJobStatus,
        retryJob,
        refresh: () => {
            // Manually trigger refresh
            setState(prev => ({ ...prev, isLoading: true }));
        },
    };
}
