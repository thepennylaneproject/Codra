/**
 * Hook for polling benchmark status during execution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { benchmarkApi } from '../../../lib/api/benchmark';
import type { Benchmark, BenchmarkStatusResponse } from '../../../lib/ai/types-benchmark';

interface UseBenchmarkPollingOptions {
  benchmarkId: string | null;
  enabled?: boolean;
  intervalMs?: number;
  onComplete?: (benchmark: Benchmark) => void;
  onError?: (error: Error) => void;
}

export function useBenchmarkPolling({
  benchmarkId,
  enabled = true,
  intervalMs = 2000,
  onComplete,
  onError,
}: UseBenchmarkPollingOptions) {
  const [status, setStatus] = useState<BenchmarkStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!benchmarkId) return;

    try {
      const response = await benchmarkApi.poll(benchmarkId);
      setStatus(response);

      // Stop polling if completed or failed
      if (response.status === 'completed' || response.status === 'failed') {
        stopPolling();

        if (response.status === 'completed' && onComplete) {
          const fullBenchmark = await benchmarkApi.get(benchmarkId);
          if (fullBenchmark.benchmark) {
            onComplete(fullBenchmark.benchmark);
          }
        }
      }
    } catch (error) {
      stopPolling();
      if (onError) {
        onError(error instanceof Error ? error : new Error('Polling failed'));
      }
    }
  }, [benchmarkId, stopPolling, onComplete, onError]);

  const startPolling = useCallback(() => {
    if (!benchmarkId || !enabled) return;

    setIsPolling(true);
    poll(); // Initial poll

    intervalRef.current = setInterval(poll, intervalMs);
  }, [benchmarkId, enabled, intervalMs, poll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isPolling,
    startPolling,
    stopPolling,
    progress: status?.progress || { current: 0, total: 0 },
  };
}
