/**
 * USE EXECUTION HISTORY HOOK
 * Manages loading, saving, and querying execution history
 */

import { useState, useCallback, useEffect } from 'react';
import { saveExecution, getPromptExecutions, getAllExecutions, getExecutionStats, deleteExecution } from '../lib/execution-history';
import type { ExecutionRecord } from '../lib/execution-history';

/**
 * Hook for managing execution history
 */
export function useExecutionHistory(promptId?: string) {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load execution history
   */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (promptId) {
        data = await getPromptExecutions(promptId);
      } else {
        data = await getAllExecutions();
      }
      setExecutions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [promptId]);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getExecutionStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  /**
   * Save a new execution
   */
  const save = useCallback(
    async (execution: Omit<ExecutionRecord, 'id' | 'userId' | 'createdAt'>) => {
      try {
        const result = await saveExecution(execution);
        if (result) {
          // Reload history after saving
          await loadHistory();
          // Reload stats
          await loadStats();
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save execution';
        setError(message);
        throw err;
      }
    },
    [loadHistory, loadStats]
  );

  /**
   * Delete an execution
   */
  const remove = useCallback(
    async (id: string) => {
      try {
        const success = await deleteExecution(id);
        if (success) {
          // Reload history after deletion
          await loadHistory();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete execution';
        setError(message);
        throw err;
      }
    },
    [loadHistory]
  );

  /**
   * Refresh everything
   */
  const refresh = useCallback(async () => {
    await Promise.all([loadHistory(), loadStats()]);
  }, [loadHistory, loadStats]);

  // Load history on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    executions,
    stats,
    isLoading,
    error,
    save,
    remove,
    refresh,
    loadHistory,
    loadStats
  };
}
