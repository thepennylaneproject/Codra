/**
 * USE TASK EXECUTION HOOK
 * src/hooks/useTaskExecution.ts
 *
 * Manages task execution with timeout, countdown timer, and cancellation support.
 * Provides ETA display and handles timeout/cancel analytics.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/new/components/Toast';
import { useUserPreferences } from './useUserPreferences';
import { analytics } from '@/lib/analytics';
import type { SpreadTask, TaskStatus } from '@/domain/task-queue';

export interface TaskExecutionState {
  /** Current task data with status */
  task: SpreadTask | null;
  /** Seconds remaining until timeout */
  timeRemaining: number | null;
  /** Whether the task is currently being executed */
  isExecuting: boolean;
  /** Whether a cancel request is in progress */
  isCancelling: boolean;
}

interface UseTaskExecutionOptions {
  taskId: string;
  projectId: string;
  /** Initial task data if available */
  initialTask?: SpreadTask;
  /** Called when task status changes */
  onStatusChange?: (taskId: string, status: TaskStatus, timestamp?: number) => void;
}

interface UseTaskExecutionReturn extends TaskExecutionState {
  /** Start task execution with timeout */
  runTask: (executeTask: () => Promise<void>) => Promise<void>;
  /** Cancel the currently running task */
  cancelTask: () => Promise<void>;
  /** Reset execution state */
  reset: () => void;
}

export function useTaskExecution({
  taskId,
  projectId,
  initialTask,
  onStatusChange,
}: UseTaskExecutionOptions): UseTaskExecutionReturn {
  const toast = useToast();
  const { preferences } = useUserPreferences();

  // State
  const [task, setTask] = useState<SpreadTask | null>(initialTask || null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Update task and notify parent
  const updateTaskStatus = useCallback((status: TaskStatus, timestamp?: number) => {
    setTask(prev => prev ? { ...prev, status } : null);
    onStatusChange?.(taskId, status, timestamp);
  }, [taskId, onStatusChange]);

  /**
   * Run a task with timeout and countdown
   */
  const runTask = useCallback(async (executeTask: () => Promise<void>) => {
    if (isExecuting) {
      toast.warning('A task is already running');
      return;
    }

    const timeoutMinutes = preferences.taskTimeoutMinutes ?? 30;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const startedAt = Date.now();
    startTimeRef.current = startedAt;

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    // Update state
    setIsExecuting(true);
    setTimeRemaining(timeoutMinutes * 60);
    setTask(prev => prev ? {
      ...prev,
      status: 'in-progress' as TaskStatus,
      startedAt,
    } : {
      id: taskId,
      title: '',
      description: '',
      deskId: 'write',
      status: 'in-progress' as TaskStatus,
      order: 0,
      priority: 'normal',
      dependencies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt,
    });
    updateTaskStatus('in-progress', startedAt);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      const timedOutAt = Date.now();
      cleanup();
      
      setIsExecuting(false);
      setTimeRemaining(null);
      setTask(prev => prev ? {
        ...prev,
        status: 'timed-out' as TaskStatus,
      } : null);
      updateTaskStatus('timed-out');

      toast.error(`Task timed out after ${timeoutMinutes} minutes. Retry?`, 8000);

      // Analytics
      analytics.track('task_timeout', {
        taskId,
        projectId,
        timeoutMinutes,
        durationMs: timedOutAt - startedAt,
      });
    }, timeoutMs);

    // Set up countdown timer (updates every second)
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
      setTimeRemaining(remaining);
    }, 1000);

    try {
      // Execute the task
      await executeTask();

      // Success - clean up timers
      cleanup();

      const completedAt = Date.now();
      setIsExecuting(false);
      setTimeRemaining(null);
      setTask(prev => prev ? {
        ...prev,
        status: 'complete' as TaskStatus,
        completedAt: new Date().toISOString(),
      } : null);
      updateTaskStatus('complete', completedAt);

    } catch (error: unknown) {
      // Check if this was a cancellation
      if (error instanceof Error && error.name === 'AbortError') {
        // Cancellation is handled in cancelTask
        return;
      }

      cleanup();

      setIsExecuting(false);
      setTimeRemaining(null);
      setTask(prev => prev ? {
        ...prev,
        status: 'pending' as TaskStatus, // Reset to pending for retry
      } : null);
      updateTaskStatus('pending');

      // Re-throw for parent handling
      throw error;
    }
  }, [isExecuting, preferences.taskTimeoutMinutes, taskId, projectId, toast, cleanup, updateTaskStatus]);

  /**
   * Cancel the currently running task
   */
  const cancelTask = useCallback(async () => {
    if (!isExecuting) {
      return;
    }

    setIsCancelling(true);

    try {
      // Call backend cancel endpoint
      const response = await fetch('/.netlify/functions/task-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, taskId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel task');
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      cleanup();

      const cancelledAt = Date.now();
      setIsExecuting(false);
      setTimeRemaining(null);
      setTask(prev => prev ? {
        ...prev,
        status: 'cancelled' as TaskStatus,
        cancelledAt,
      } : null);
      updateTaskStatus('cancelled', cancelledAt);

      toast.info('Task cancelled');

      // Analytics
      analytics.track('task_cancelled', {
        taskId,
        projectId,
        durationMs: cancelledAt - startTimeRef.current,
      });

    } catch (error) {
      console.error('Failed to cancel task:', error);
      toast.error('Failed to cancel task');
    } finally {
      setIsCancelling(false);
    }
  }, [isExecuting, projectId, taskId, cleanup, toast, updateTaskStatus]);

  /**
   * Reset execution state
   */
  const reset = useCallback(() => {
    cleanup();
    setTask(initialTask || null);
    setTimeRemaining(null);
    setIsExecuting(false);
    setIsCancelling(false);
  }, [cleanup, initialTask]);

  return {
    task,
    timeRemaining,
    isExecuting,
    isCancelling,
    runTask,
    cancelTask,
    reset,
  };
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null) return '';
  
  if (seconds < 60) {
    return `${seconds}s remaining`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  
  if (remainingSecs === 0) {
    return `${minutes}m remaining`;
  }
  
  return `${minutes}m ${remainingSecs}s remaining`;
}
