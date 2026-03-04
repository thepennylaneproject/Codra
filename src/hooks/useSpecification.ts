import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/api/auth';
import { ProjectSpecification } from '../domain/types';
import { TaskQueue } from '../domain/task-queue';
import { useAuth } from './useAuth';
import { analytics } from '@/lib/analytics';
import { getErrorMessageForStatus } from '@/lib/api/apiClient';
import { useConflictDetection } from './useConflictDetection';
import { useToast } from '@/new/components/Toast';

// ============================================================
// Types for Queued Operations
// ============================================================

interface QueuedSpecificationSave {
  type: 'specification';
  projectId: string;
  userId: string;
  specification: ProjectSpecification;
  timestamp: number;
}

interface QueuedTaskQueueSave {
  type: 'taskQueue';
  projectId: string;
  userId: string;
  taskQueue: TaskQueue;
  timestamp: number;
}

type QueuedSave = QueuedSpecificationSave | QueuedTaskQueueSave;

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
    console.error('[SupabaseSpecification] Failed to persist queue:', error);
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
          endpoint: 'supabase_specification',
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
 * HOOK: useSpecification
 * Handles persistent storage of ProjectSpecification and TaskQueue in Supabase.
 * Now with network awareness, retry logic, and offline queue.
 */
export function useSpecification(projectId: string | undefined) {
  const { user } = useAuth();
  const toast = useToast();
  const [specification, setSpecification] = useState<ProjectSpecification | null>(null);
  const [baseSpecification, setBaseSpecification] = useState<ProjectSpecification | null>(null); // ARCH-011: Track base for 3-way diff
  const [taskQueue, setTaskQueue] = useState<TaskQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [specSaving, setSpecSaving] = useState(false);
  const [queueSaving, setQueueSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { conflict, setConflict, saveWithConflictCheck, resolveConflict } = useConflictDetection();
  
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const normalizeTaskQueue = useCallback((queue: TaskQueue): TaskQueue => {
    // Legacy mapping if needed (task-queue.ts refactored to remove tearSheetVersion)
    const contextVersion = queue.contextVersion || 1;
    const tasks = queue.tasks.map((task) => ({
      ...task,
      contextAnchor: task.contextAnchor,
    }));
    return { ...queue, contextVersion, tasks };
  }, []);

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

    console.log(`[SupabaseSpecification] Flushing ${queue.length} queued saves...`);
    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'specification') {
          const dbRow = {
            project_id: item.projectId,
            user_id: item.userId,
            sections: item.specification.sections,
            toc: item.specification.toc,
            // Map assistantState to lyra_state (DB column name remains lyra_state for now)
            lyra_state: item.specification.assistantState,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from('specifications')
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
            tear_sheet_version: item.taskQueue.contextVersion || 1,
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
        console.error('[SupabaseSpecification] Queue flush failed for item:', item, err);
        failCount++;
      }
    }

    if (successCount > 0 || failCount > 0) {
      analytics.track('offline_queue_flushed', {
        successCount,
        failCount,
      });
    }

    console.log(`[SupabaseSpecification] Queue flush complete: ${successCount} success, ${failCount} failed`);
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
        const { data: specifications, error: specError } = await supabase
          .from('specifications')
          .select('*')
          .eq('project_id', projectId)
          .limit(1);

        if (specError) throw specError;

        const specData = specifications?.[0];
        if (specData) {
          const spec = {
            id: specData.id,
            projectId: specData.project_id,
            sections: specData.sections,
            toc: specData.toc,
            // Map DB column lyra_state to assistantState
            assistantState: specData.lyra_state,
            version: specData.version || 1,
            lastModifiedBy: specData.last_modified_by,
            lastModifiedAt: specData.last_modified_at,
            createdAt: specData.created_at,
            updatedAt: specData.updated_at,
          };
          setSpecification(spec);
          setBaseSpecification(spec); // ARCH-011: Initialize base
          setVersion(specData.version || 1);
        }

        const { data: queues, error: queueError } = await supabase
          .from('task_queues')
          .select('*')
          .eq('project_id', projectId)
          .limit(1);

        if (queueError) throw queueError;

        const queueData = queues?.[0];
        if (queueData) {
          setTaskQueue(normalizeTaskQueue({
            id: queueData.id,
            projectId: queueData.project_id,
            tasks: queueData.tasks,
            generatedAt: queueData.generated_at,
            contextVersion: queueData.tear_sheet_version,
            stale: queueData.stale,
          }));
        }
      } catch (err) {
        console.error('Error loading specification data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        analytics.track('network_failure', {
          errorType: 'network_error',
          endpoint: 'specifications_load',
          pageContext: 'WorkspacePage',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId, user, normalizeTaskQueue]);

  // --------------------------------------------------------
  // Save Specification Function (with offline queue)
  // --------------------------------------------------------

  const saveSpecification = useCallback(async (updatedSpec: ProjectSpecification) => {
    if (!user || !projectId || specSaving || !isUuid(projectId)) return { success: false };

    // Optimistic update
    setSpecification(updatedSpec);
    
    // If offline, queue the save
    if (!isOnline) {
      addToQueue({
        type: 'specification',
        projectId,
        userId: user.id,
        specification: updatedSpec,
        timestamp: Date.now(),
      });
      
      analytics.track('offline_queue_added', {
        endpoint: 'specifications',
        queueSize: loadQueue().length,
      });
      
      console.log('[SupabaseSpecification] Offline - specification queued for later');
      return { success: true };
    }

    setSpecSaving(true);
    setError(null);

    try {
      // ARCH-011: Pass baseSpecification for 3-way conflict detection
      const base = baseSpecification || updatedSpec; // Fallback if base is missing logic
      const result = await saveWithConflictCheck(projectId, updatedSpec.id, updatedSpec, version, base);
      
      if (result.success) {
        if (result.version) {
            setVersion(result.version);
            const newSpec = (prev: ProjectSpecification | null) => (prev ? { ...prev, version: result.version! } : null);
            setSpecification(newSpec);
            
            // Update base state to current successful save (it is now the baseline)
            setBaseSpecification(updatedSpec);
        }
        return { success: true, conflict: false };
      }

      if (result.conflict) {
        return { success: false, conflict: true };
      }

      setError(result.error || 'Save failed');
      return { success: false, error: result.error };

    } catch (err: any) {
      console.error('Error saving specification:', err);
      
      // Queue for later if network error
      if (!navigator.onLine || err?.message?.includes('network') || err?.message?.includes('fetch')) {
        addToQueue({
          type: 'specification',
          projectId,
          userId: user.id,
          specification: updatedSpec,
          timestamp: Date.now(),
        });
      }
      
      analytics.track('network_failure', {
        errorType: 'server_error',
        endpoint: 'specifications_save',
        pageContext: 'WorkspacePage',
      });
      
      const message = err?.code ? getErrorMessageForStatus(parseInt(err.code, 10)) : (err?.message || 'Save error');
      setError(message);
      toast.error(`Failed to save: ${message}`);
      return { success: false, error: message };
    } finally {
      setSpecSaving(false);
    }
  }, [user, projectId, isOnline, specSaving, version, saveWithConflictCheck, baseSpecification]);

  // --------------------------------------------------------
  // Save Task Queue Function (with offline queue)
  // --------------------------------------------------------

  const saveTaskQueue = useCallback(async (updatedQueue: TaskQueue) => {
    if (!user || !projectId || queueSaving || !isUuid(projectId)) return;

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
      
      console.log('[SupabaseSpecification] Offline - task queue queued for later');
      return;
    }

    setQueueSaving(true);
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
          tear_sheet_version: updatedQueue.contextVersion,
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
        pageContext: 'WorkspacePage',
      });
      
      const message = err?.code ? getErrorMessageForStatus(parseInt(err.code, 10)) : (err?.message || 'Save error');
      setError(message);
      toast.error(`Failed to save task queue: ${message}`);
    } finally {
      setQueueSaving(false);
    }
  }, [user, projectId, isOnline, queueSaving]);

  return {
    specification,
    taskQueue,
    loading,
    saving: specSaving || queueSaving,
    error,
    isOnline,
    saveSpecification,
    saveTaskQueue,
    setSpecification,
    setTaskQueue,
    flushQueue,
    conflict,
    setConflict,
    resolveConflict,
    version,
  };
}
