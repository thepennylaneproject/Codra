import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/api/auth';
import { Spread } from '../domain/types';
import { TaskQueue } from '../domain/task-queue';
import { useAuth } from './useAuth';
import { analytics } from '@/lib/analytics';
import { getErrorMessageForStatus } from '@/lib/api/apiClient';
import { useConflictDetection } from './useConflictDetection';

// ============================================================
// Types for Queued Operations
// ============================================================

interface QueuedSpreadSave {
  type: 'spread';
  projectId: string;
  userId: string;
  spread: Spread;
  timestamp: number;
}

interface QueuedTaskQueueSave {
  type: 'taskQueue';
  projectId: string;
  userId: string;
  taskQueue: TaskQueue;
  timestamp: number;
}

type QueuedSave = QueuedSpreadSave | QueuedTaskQueueSave;

const QUEUE_STORAGE_KEY = 'codra_supabase_save_queue';

// ============================================================
// Queue Helpers
// ============================================================

function loadQueue(): QueuedSave[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function persistQueue(queue: QueuedSave[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[SupabaseSpread] Failed to persist queue:', error);
  }
}

function addToQueue(item: QueuedSave): void {
  const queue = loadQueue();
  // Deduplicate: remove older items for the same project + type
  const filtered = queue.filter(
    (q) => !(q.type === item.type && q.projectId === item.projectId)
  );
  filtered.push(item);
  persistQueue(filtered);
}

// ============================================================
// Retry Helper with Exponential Backoff
// ============================================================

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        analytics.track('network_retry', {
          attempt: attempt + 1,
          endpoint: 'supabase_spread',
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error('Operation failed after retries');
}

// ============================================================
// Main Hook
// ============================================================

/**
 * HOOK: useSupabaseSpread
 * Handles persistent storage of Spread and TaskQueue in Supabase.
 * Now with network awareness, retry logic, and offline queue.
 */
export function useSupabaseSpread(projectId: string | undefined) {
  const { user } = useAuth();
  const [spread, setSpread] = useState<Spread | null>(null);
  const [taskQueue, setTaskQueue] = useState<TaskQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { conflict, setConflict, saveWithConflictCheck, resolveConflict } = useConflictDetection();
  
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  // --------------------------------------------------------
  // Online/Offline Event Handlers
  // --------------------------------------------------------

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Flush queued saves when back online
      await flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for queued items on mount
    if (navigator.onLine) {
      flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --------------------------------------------------------
  // Flush Queue
  // --------------------------------------------------------

  const flushQueue = useCallback(async () => {
    if (!user) return;
    
    const queue = loadQueue();
    if (queue.length === 0) return;

    console.log(`[SupabaseSpread] Flushing ${queue.length} queued saves...`);
    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'spread') {
          const dbRow = {
            project_id: item.projectId,
            user_id: item.userId,
            sections: item.spread.sections,
            toc: item.spread.toc,
            lyra_state: item.spread.lyraState,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from('spreads')
            .upsert(dbRow, { onConflict: 'project_id' });

          if (upsertError) throw upsertError;
          successCount++;
        } else if (item.type === 'taskQueue') {
          const dbRow = {
            project_id: item.projectId,
            user_id: item.userId,
            tasks: item.taskQueue.tasks,
            version: 1,
            stale: item.taskQueue.stale,
            generated_at: item.taskQueue.generatedAt,
            tear_sheet_version: item.taskQueue.tearSheetVersion,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from('task_queues')
            .upsert(dbRow, { onConflict: 'project_id' });

          if (upsertError) throw upsertError;
          successCount++;
        }

        // Remove from queue on success
        const updatedQueue = loadQueue().filter(
          (q) => !(q.type === item.type && q.projectId === item.projectId && q.timestamp === item.timestamp)
        );
        persistQueue(updatedQueue);
      } catch (err) {
        console.error('[SupabaseSpread] Queue flush failed for item:', item, err);
        failCount++;
      }
    }

    if (successCount > 0 || failCount > 0) {
      analytics.track('offline_queue_flushed', {
        successCount,
        failCount,
      });
    }

    console.log(`[SupabaseSpread] Queue flush complete: ${successCount} success, ${failCount} failed`);
  }, [user]);

  // --------------------------------------------------------
  // Load Data from Supabase
  // --------------------------------------------------------

  useEffect(() => {
    if (!projectId || !user || !isUuid(projectId)) {
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const { data: spreads, error: spreadError } = await supabase
          .from('spreads')
          .select('*')
          .eq('project_id', projectId)
          .limit(1);

        if (spreadError) throw spreadError;

        const spreadData = spreads?.[0];
        if (spreadData) {
          setSpread({
            id: spreadData.id,
            projectId: spreadData.project_id,
            sections: spreadData.sections,
            toc: spreadData.toc,
            lyraState: spreadData.lyra_state,
            version: spreadData.version || 1,
            lastModifiedBy: spreadData.last_modified_by,
            lastModifiedAt: spreadData.last_modified_at,
            createdAt: spreadData.created_at,
            updatedAt: spreadData.updated_at,
          });
          setVersion(spreadData.version || 1);
        }

        const { data: queues, error: queueError } = await supabase
          .from('task_queues')
          .select('*')
          .eq('project_id', projectId)
          .limit(1);

        if (queueError) throw queueError;

        const queueData = queues?.[0];
        if (queueData) {
          setTaskQueue({
            id: queueData.id,
            projectId: queueData.project_id,
            tasks: queueData.tasks,
            generatedAt: queueData.generated_at,
            tearSheetVersion: queueData.tear_sheet_version,
            stale: queueData.stale,
          });
        }
      } catch (err) {
        console.error('Error loading spread data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        analytics.track('network_failure', {
          errorType: 'network_error',
          endpoint: 'spreads_load',
          pageContext: 'ExecutionDeskPage',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId, user]);

  // --------------------------------------------------------
  // Save Spread Function (with offline queue)
  // --------------------------------------------------------

  const saveSpread = useCallback(async (updatedSpread: Spread) => {
    if (!user || !projectId || saving || !isUuid(projectId)) return { success: false };

    // Optimistic update
    setSpread(updatedSpread);
    
    // If offline, queue the save
    if (!isOnline) {
      addToQueue({
        type: 'spread',
        projectId,
        userId: user.id,
        spread: updatedSpread,
        timestamp: Date.now(),
      });
      
      analytics.track('offline_queue_added', {
        endpoint: 'spreads',
        queueSize: loadQueue().length,
      });
      
      console.log('[SupabaseSpread] Offline - spread queued for later');
      return { success: true };
    }

    setSaving(true);
    setError(null);

    try {
      const result = await saveWithConflictCheck(projectId, updatedSpread.id, updatedSpread, version);
      
      if (result.success) {
        if (result.version) {
            setVersion(result.version);
            setSpread(prev => prev ? { ...prev, version: result.version! } : null);
        }
        return { success: true, conflict: false };
      }

      if (result.conflict) {
        return { success: false, conflict: true };
      }

      setError(result.error || 'Save failed');
      return { success: false, error: result.error };

    } catch (err: any) {
      console.error('Error saving spread:', err);
      
      // Queue for later if network error
      if (!navigator.onLine || err?.message?.includes('network') || err?.message?.includes('fetch')) {
        addToQueue({
          type: 'spread',
          projectId,
          userId: user.id,
          spread: updatedSpread,
          timestamp: Date.now(),
        });
      }
      
      analytics.track('network_failure', {
        errorType: 'server_error',
        endpoint: 'spreads_save',
        pageContext: 'ExecutionDeskPage',
      });
      
      const message = err?.code ? getErrorMessageForStatus(parseInt(err.code, 10)) : (err?.message || 'Save error');
      setError(message);
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  }, [user, projectId, isOnline, saving, version, saveWithConflictCheck]);

  // --------------------------------------------------------
  // Save Task Queue Function (with offline queue)
  // --------------------------------------------------------

  const saveTaskQueue = useCallback(async (updatedQueue: TaskQueue) => {
    if (!user || !projectId || saving || !isUuid(projectId)) return;

    // Optimistic update
    setTaskQueue(updatedQueue);
    
    // If offline, queue the save
    if (!isOnline) {
      addToQueue({
        type: 'taskQueue',
        projectId,
        userId: user.id,
        taskQueue: updatedQueue,
        timestamp: Date.now(),
      });
      
      analytics.track('offline_queue_added', {
        endpoint: 'task_queues',
        queueSize: loadQueue().length,
      });
      
      console.log('[SupabaseSpread] Offline - task queue queued for later');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await withRetry(async () => {
        const dbRow = {
          project_id: projectId,
          user_id: user.id,
          tasks: updatedQueue.tasks,
          version: 1,
          stale: updatedQueue.stale,
          generated_at: updatedQueue.generatedAt,
          tear_sheet_version: updatedQueue.tearSheetVersion,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase
          .from('task_queues')
          .upsert(dbRow, { onConflict: 'project_id' });

        if (upsertError) throw upsertError;
      });
    } catch (err: any) {
      console.error('Error saving task queue:', err);
      
      // Queue for later if network error
      if (!navigator.onLine || err?.message?.includes('network') || err?.message?.includes('fetch')) {
        addToQueue({
          type: 'taskQueue',
          projectId,
          userId: user.id,
          taskQueue: updatedQueue,
          timestamp: Date.now(),
        });
      }
      
      analytics.track('network_failure', {
        errorType: 'server_error',
        endpoint: 'task_queues_save',
        pageContext: 'ExecutionDeskPage',
      });
      
      const message = err?.code ? getErrorMessageForStatus(parseInt(err.code, 10)) : (err?.message || 'Save error');
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [user, projectId, isOnline, saving]);

  return {
    spread,
    taskQueue,
    loading,
    saving,
    error,
    isOnline,
    saveSpread,
    saveTaskQueue,
    setSpread,
    setTaskQueue,
    flushQueue,
    conflict,
    setConflict,
    resolveConflict,
    version,
  };
}

