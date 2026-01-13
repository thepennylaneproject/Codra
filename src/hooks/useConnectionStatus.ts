/**
 * CONNECTION STATUS HOOK
 * src/hooks/useConnectionStatus.ts
 *
 * Tracks online/offline status and manages the offline queue.
 * Shows toasts for connection state changes.
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineQueue } from '@/lib/api/offline-queue';
import { useToast } from '@/new/components/Toast';
import { analytics } from '@/lib/analytics';

export type ConnectionState = 'online' | 'offline' | 'retrying';

interface UseConnectionStatusReturn {
  /** Current connection state */
  isOnline: boolean;
  /** Whether we're currently retrying a request */
  retrying: boolean;
  /** Detailed connection state */
  connectionState: ConnectionState;
  /** Number of requests pending in offline queue */
  pendingRequests: number;
  /** Set retrying state (for retry UI feedback) */
  setRetrying: (value: boolean) => void;
  /** Manually trigger queue flush */
  flushQueue: () => Promise<void>;
}

/**
 * Hook to manage connection state and offline queue
 */
export function useConnectionStatus(): UseConnectionStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [retrying, setRetrying] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const toast = useToast();

  // Derive connection state
  const connectionState: ConnectionState = retrying 
    ? 'retrying' 
    : isOnline 
      ? 'online' 
      : 'offline';

  /**
   * Flush the offline queue
   */
  const flushQueue = useCallback(async () => {
    if (!offlineQueue.hasPending()) return;

    setRetrying(true);
    
    try {
      const result = await offlineQueue.flush();
      
      if (result.success > 0) {
        toast.success(`${result.success} pending change${result.success > 1 ? 's' : ''} saved`);
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} change${result.failed > 1 ? 's' : ''} failed to save. Will retry.`);
      }

      analytics.track('network_recovery', {
        endpoint: 'offline_queue',
        queuedRequestCount: result.success + result.failed,
      });
    } finally {
      setRetrying(false);
      setPendingRequests(offlineQueue.size());
    }
  }, [toast]);

  /**
   * Handle coming back online
   */
  const handleOnline = useCallback(async () => {
    setIsOnline(true);
    toast.success('Back online');
    
    // Flush offline queue
    await flushQueue();
  }, [toast, flushQueue]);

  /**
   * Handle going offline
   */
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    toast.error('No connection. Saving when you\'re back online.', 0); // 0 = persistent
  }, [toast]);

  // Initialize and set up event listeners
  useEffect(() => {
    // Load offline queue on mount
    offlineQueue.load();
    setPendingRequests(offlineQueue.size());

    // Set up online/offline event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state and flush if needed
    if (navigator.onLine && offlineQueue.hasPending()) {
      flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, flushQueue]);

  // Periodically update pending count
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingRequests(offlineQueue.size());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    retrying,
    connectionState,
    pendingRequests,
    setRetrying,
    flushQueue,
  };
}
