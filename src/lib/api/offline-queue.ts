/**
 * OFFLINE QUEUE
 * src/lib/api/offline-queue.ts
 *
 * Queues write operations when offline and flushes them when connectivity is restored.
 * Uses localStorage for persistence.
 */

import { fetchWithRetry } from './apiClient';
import { analytics } from '@/lib/analytics';

// ============================================================
// Types
// ============================================================

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retries: number;
  pageContext?: string;
}

// ============================================================
// Offline Queue
// ============================================================

const STORAGE_KEY = 'codra_offlineQueue';

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isFlushing = false;

  /**
   * Load queue from localStorage on app start
   */
  load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} pending requests`);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Persist queue to localStorage
   */
  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to persist queue:', error);
    }
  }

  /**
   * Add a request to the queue
   */
  add(url: string, options: RequestInit, pageContext?: string): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // Clone options to avoid mutation issues with body
    const clonedOptions: RequestInit = {
      method: options.method,
      headers: options.headers ? { ...options.headers as Record<string, string> } : undefined,
      body: options.body,
    };

    this.queue.push({
      id,
      url,
      options: clonedOptions,
      timestamp: Date.now(),
      retries: 0,
      pageContext,
    });

    this.persist();

    analytics.track('offline_queue_added', {
      endpoint: url,
      queueSize: this.queue.length,
    });

    console.log(`[OfflineQueue] Added request: ${url} (queue size: ${this.queue.length})`);
    return id;
  }

  /**
   * Get the current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue has pending requests
   */
  hasPending(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Flush all queued requests
   * Called when connection is restored
   */
  async flush(): Promise<{ success: number; failed: number }> {
    if (this.isFlushing) {
      console.log('[OfflineQueue] Flush already in progress');
      return { success: 0, failed: 0 };
    }

    if (this.queue.length === 0) {
      console.log('[OfflineQueue] No requests to flush');
      return { success: 0, failed: 0 };
    }

    this.isFlushing = true;
    console.log(`[OfflineQueue] Flushing ${this.queue.length} requests...`);

    const queueSnapshot = [...this.queue];
    let successCount = 0;
    let failCount = 0;

    // Deduplicate similar requests (same URL + method within short time window)
    const deduplicatedQueue = this.deduplicateQueue(queueSnapshot);

    for (const request of deduplicatedQueue) {
      try {
        const response = await fetchWithRetry(
          request.url, 
          request.options, 
          undefined, 
          request.pageContext || 'offline_queue'
        );

        if (response.ok) {
          // Remove from queue
          this.queue = this.queue.filter((r) => r.id !== request.id);
          this.persist();
          successCount++;
          console.log(`[OfflineQueue] Successfully flushed: ${request.url}`);
        } else {
          console.error(`[OfflineQueue] Request failed with status ${response.status}: ${request.url}`);
          failCount++;
          // Keep in queue for future retry
        }
      } catch (error) {
        console.error(`[OfflineQueue] Request failed: ${request.url}`, error);
        failCount++;
        // Keep in queue for future retry
      }
    }

    this.isFlushing = false;

    analytics.track('offline_queue_flushed', {
      successCount,
      failCount,
    });

    console.log(`[OfflineQueue] Flush complete: ${successCount} success, ${failCount} failed`);
    return { success: successCount, failed: failCount };
  }

  /**
   * Deduplicate queue entries - for the same endpoint and method,
   * keep only the most recent request (to avoid redundant saves)
   */
  private deduplicateQueue(queue: QueuedRequest[]): QueuedRequest[] {
    const seen = new Map<string, QueuedRequest>();

    // Process in order - later entries will overwrite earlier ones for same key
    for (const request of queue) {
      const key = `${request.options.method || 'GET'}:${request.url}`;
      const existing = seen.get(key);

      // Keep the most recent request
      if (!existing || request.timestamp > existing.timestamp) {
        // If replacing, remove the old one from this.queue
        if (existing) {
          this.queue = this.queue.filter((r) => r.id !== existing.id);
        }
        seen.set(key, request);
      } else {
        // This request is older - remove it from this.queue
        this.queue = this.queue.filter((r) => r.id !== request.id);
      }
    }

    this.persist();
    return Array.from(seen.values());
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    this.queue = [];
    this.persist();
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * Get all pending requests (for debugging/display)
   */
  getPending(): QueuedRequest[] {
    return [...this.queue];
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();
