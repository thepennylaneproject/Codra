// src/components/benchmark/hooks/useBenchmark.ts
/**
 * useBenchmark Hook
 * Manages benchmark queries and mutations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Benchmark } from '../../../lib/ai/types-benchmark';

interface UseBenchmarkReturn {
  useBenchmarkQuery: () => {
    data: Benchmark[] | undefined;
    error: Error | null;
    isLoading: boolean;
    refetch: () => Promise<any>;
  };
  useCreateBenchmark: () => {
    mutate: (data: any) => Promise<any>;
    isLoading: boolean;
    error: Error | null;
  };
  useStartBenchmark: () => {
    mutate: (benchmarkId: string) => Promise<any>;
    isLoading: boolean;
    error: Error | null;
  };
  useDeleteBenchmark: () => {
    mutate: (benchmarkId: string) => Promise<any>;
    isLoading: boolean;
    error: Error | null;
  };
  useGetBenchmark: (benchmarkId: string) => {
    data: Benchmark | undefined;
    error: Error | null;
    isLoading: boolean;
    refetch: () => Promise<any>;
  };
}

export function useBenchmark(): UseBenchmarkReturn {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('auth_token') || '';

  // Query: List all benchmarks
  const useBenchmarkQuery = () => {
    return useQuery({
      queryKey: ['benchmarks'],
      queryFn: async () => {
        const response = await fetch('/.netlify/functions/api/benchmark/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch benchmarks');
        }

        const data = await response.json();
        return data.benchmarks || [];
      },
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mutation: Create benchmark
  const useCreateBenchmark = () => {
    return {
      mutate: async (data: any) => {
        const response = await fetch('/.netlify/functions/api/benchmark/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to create benchmark');
        }

        const result = await response.json();
        queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
        return result;
      },
      isLoading: false,
      error: null,
    };
  };

  // Mutation: Start benchmark
  const useStartBenchmark = () => {
    return {
      mutate: async (benchmarkId: string) => {
        const response = await fetch('/.netlify/functions/api/benchmark/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ benchmarkId }),
        });

        if (!response.ok) {
          throw new Error('Failed to start benchmark');
        }

        const result = await response.json();
        queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
        return result;
      },
      isLoading: false,
      error: null,
    };
  };

  // Mutation: Delete benchmark
  const useDeleteBenchmark = () => {
    return {
      mutate: async (benchmarkId: string) => {
        const response = await fetch(`/.netlify/functions/api/benchmark/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ benchmarkId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete benchmark');
        }

        queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      },
      isLoading: false,
      error: null,
    };
  };

  // Query: Get single benchmark
  const useGetBenchmark = (benchmarkId: string) => {
    return useQuery({
      queryKey: ['benchmark', benchmarkId],
      queryFn: async () => {
        const response = await fetch(
          `/.netlify/functions/api/benchmark/get?id=${benchmarkId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch benchmark');
        }

        const data = await response.json();
        return data.benchmark;
      },
      enabled: !!benchmarkId,
      staleTime: 10000, // 10 seconds
      gcTime: 5 * 60 * 1000,
    });
  };

  return {
    useBenchmarkQuery,
    useCreateBenchmark,
    useStartBenchmark,
    useDeleteBenchmark,
    useGetBenchmark,
  };
}
