/**
 * USE ACTIVITY STATUS
 * Hook for aggregating status from various sources
 */

import { useState, useCallback } from 'react';
import { Alert } from './useAlerts';

export interface ProgressStatus {
    status: 'idle' | 'executing' | 'complete' | 'error';
    message: string;
    taskId?: string;
}

export interface ActivityState {
    progress: ProgressStatus;
    budget: {
        spentToday: number;
        dailyLimit: number;
        health: 'healthy' | 'warning' | 'critical';
    };
    context?: {
        usage: number; // 0-100
        enabled: boolean;
    };
    alerts: Alert[];
}

export function useActivityStatus() {
    const [progress, setProgress] = useState<ProgressStatus>({
        status: 'idle',
        message: 'Idle',
    });

    const [contextUsage, setContextUsage] = useState<number>(0);
    const [contextEnabled, setContextEnabled] = useState(false);

    // Update progress status
    const updateProgress = useCallback((update: Partial<ProgressStatus>) => {
        setProgress(prev => ({ ...prev, ...update }));
    }, []);

    // Start task execution
    const startTask = useCallback((taskId: string, message: string) => {
        setProgress({
            status: 'executing',
            message,
            taskId,
        });
    }, []);

    // Complete task
    const completeTask = useCallback(() => {
        setProgress({
            status: 'complete',
            message: 'Execution complete',
        });

        // Reset to idle after 2 seconds
        setTimeout(() => {
            setProgress({
                status: 'idle',
                message: 'Idle',
            });
        }, 2000);
    }, []);

    // Error in task
    const errorTask = useCallback((message: string) => {
        setProgress({
            status: 'error',
            message,
        });
    }, []);

    // Update context window usage
    const updateContextUsage = useCallback((usage: number) => {
        setContextUsage(Math.min(100, Math.max(0, usage)));
    }, []);

    return {
        progress,
        context: contextEnabled ? { usage: contextUsage, enabled: true } : undefined,
        updateProgress,
        startTask,
        completeTask,
        errorTask,
        updateContextUsage,
        setContextEnabled,
    };
}
