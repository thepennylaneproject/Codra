/**
 * Benchmark API Client
 * Handles all benchmark-related API calls with proper authentication
 */

import { supabase } from '../supabase';
import type {
  CreateBenchmarkRequest,
  CreateBenchmarkResponse,
  StartBenchmarkResponse,
  BenchmarkStatusResponse,
  GetBenchmarkResponse,
  ListBenchmarksResponse,
} from '../ai/types-benchmark';

const API_BASE = '/.netlify/functions/api/benchmark';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

export const benchmarkApi = {
  async create(request: CreateBenchmarkRequest): Promise<CreateBenchmarkResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create benchmark');
    }

    return response.json();
  },

  async start(benchmarkId: string): Promise<StartBenchmarkResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ benchmarkId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start benchmark');
    }

    return response.json();
  },

  async poll(benchmarkId: string): Promise<BenchmarkStatusResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/poll?benchmarkId=${benchmarkId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to poll benchmark');
    }

    return response.json();
  },

  async get(benchmarkId: string): Promise<GetBenchmarkResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/get?benchmarkId=${benchmarkId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get benchmark');
    }

    return response.json();
  },

  async list(): Promise<ListBenchmarksResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/list`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list benchmarks');
    }

    return response.json();
  },

  async delete(benchmarkId: string): Promise<{ success: boolean; error?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/delete`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ benchmarkId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete benchmark');
    }

    return response.json();
  },

  async export(benchmarkId: string, format: 'json' | 'csv'): Promise<Blob> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/export?benchmarkId=${benchmarkId}&format=${format}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to export benchmark');
    }

    return response.blob();
  },
};
