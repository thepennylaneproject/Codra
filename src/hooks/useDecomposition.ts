/**
 * Hook for AI-powered project decomposition
 */

import { useState, useCallback } from 'react';
import { useProjectStore } from '../lib/store/project-store';
import { architectApi } from '../lib/api/architect/adapter';

type DecompositionDepth = 'workstreams' | 'tasks' | 'prompts';

interface DecompositionProgress {
    stage: 'idle' | 'workstreams' | 'tasks' | 'prompts' | 'complete' | 'error';
    workstreamsGenerated: number;
    tasksGenerated: number;
    promptsGenerated: number;
    message: string;
}

export function useDecomposition() {
    const { loadProjectContext } = useProjectStore();
    const [isDecomposing, setIsDecomposing] = useState(false);
    const [progress, setProgress] = useState<DecompositionProgress>({
        stage: 'idle',
        workstreamsGenerated: 0,
        tasksGenerated: 0,
        promptsGenerated: 0,
        message: '',
    });
    const [error, setError] = useState<string | null>(null);

    const decompose = useCallback(async (projectId: string, depth: DecompositionDepth = 'prompts') => {
        setIsDecomposing(true);
        setError(null);

        // Initial progress state
        setProgress({
            stage: 'workstreams',
            workstreamsGenerated: 0,
            tasksGenerated: 0,
            promptsGenerated: 0,
            message: 'Analyzing project and generating workstreams...',
        });

        try {
            // The decomposition API currently handles all steps in one go, 
            // but in a real-world scenario we might want to poll or split this up.
            // For now, we wait for the full response.
            const response = await architectApi.decompose(projectId, depth);

            if (!response.success) {
                throw new Error(response.error || 'Decomposition failed');
            }

            // Update progress based on results
            setProgress({
                stage: 'complete',
                workstreamsGenerated: response.workstreams?.length || 0,
                tasksGenerated: response.tasks?.length || 0,
                promptsGenerated: response.prompts?.length || 0,
                message: 'Decomposition complete!',
            });

            // Load results into store
            loadProjectContext({
                workstreams: response.workstreams,
                tasks: response.tasks,
                prompts: response.prompts,
            });

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Decomposition failed';
            setError(errorMessage);
            setProgress((prev) => ({
                ...prev,
                stage: 'error',
                message: errorMessage,
            }));
            throw err;
        } finally {
            setIsDecomposing(false);
        }
    }, [loadProjectContext]);

    const reset = useCallback(() => {
        setProgress({
            stage: 'idle',
            workstreamsGenerated: 0,
            tasksGenerated: 0,
            promptsGenerated: 0,
            message: '',
        });
        setError(null);
    }, []);

    return {
        decompose,
        isDecomposing,
        progress,
        error,
        reset,
    };
}
