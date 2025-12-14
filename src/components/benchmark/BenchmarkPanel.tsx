// src/components/benchmark/BenchmarkPanel.tsx
/**
 * Benchmark Panel - Main UI Component
 * - Create and manage benchmarks
 * - Run benchmarks with model comparison
 * - View results and recommendations
 */

import React, { useState, useEffect } from 'react';
import type { Benchmark } from '../../lib/ai/types-benchmark';
import { BenchmarkForm } from './BenchmarkForm';
import { BenchmarkResults } from './BenchmarkForm';
import { useAuth } from '../../hooks/useAuth';
import { useBenchmark } from './hooks/useBenchmark';
import { benchmarkApi } from '../../lib/api/benchmark';
import { useBenchmarkPolling } from './hooks/useBenchmarkPolling';

interface BenchmarkPanelProps {
  onClose?: () => void;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'create' | 'results'>('list');
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningBenchmarkId, setRunningBenchmarkId] = useState<string | null>(null);

  const { useBenchmarkQuery } = useBenchmark();
  const benchmarksQuery = useBenchmarkQuery();

  const { status: pollingStatus, progress, startPolling } = useBenchmarkPolling({
    benchmarkId: runningBenchmarkId,
    enabled: !!runningBenchmarkId,
    intervalMs: 2000,
    onComplete: (benchmark) => {
      setSelectedBenchmark(benchmark);
      setRunningBenchmarkId(null);
      setView('results');
      benchmarksQuery.refetch();
    },
    onError: (error) => {
      setError(error.message);
      setRunningBenchmarkId(null);
    },
  });

  useEffect(() => {
    if (benchmarksQuery.data) {
      setBenchmarks(benchmarksQuery.data);
    }
  }, [benchmarksQuery.data]);

  const handleCreateBenchmark = async (
    name: string,
    prompt: string,
    type: 'text' | 'image',
    models: string[],
    parameters?: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const createResponse = await benchmarkApi.create({
        name,
        prompt,
        type,
        models,
        parameters,
      });

      if (createResponse.success && createResponse.benchmarkId) {
        const startResponse = await benchmarkApi.start(createResponse.benchmarkId);

        if (startResponse.success) {
          setRunningBenchmarkId(createResponse.benchmarkId);
          startPolling();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create benchmark');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBenchmark = async (benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark);
    setView('results');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-zinc-400">Please sign in to use benchmarks</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-lg border border-zinc-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Model Benchmarking</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Compare AI models side-by-side • aimlapi batch API saves 50% on costs
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      {runningBenchmarkId && pollingStatus && (
        <div className="px-6 py-4 bg-indigo-500/10 border-b border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-300 font-medium">Running benchmark...</span>
            <span className="text-zinc-400 text-sm">
              {progress.current} / {progress.total} models
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-6 py-3 border-b border-zinc-800 flex gap-3">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded transition-colors ${view === 'list'
            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/50'
            : 'text-zinc-400 hover:text-zinc-200'
            }`}
        >
          Benchmarks
        </button>
        <button
          onClick={() => setView('create')}
          className={`px-4 py-2 rounded transition-colors ${view === 'create'
            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/50'
            : 'text-zinc-400 hover:text-zinc-200'
            }`}
        >
          New Benchmark
        </button>
        {selectedBenchmark && (
          <button
            onClick={() => setView('results')}
            className={`px-4 py-2 rounded transition-colors ${view === 'results'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/50'
              : 'text-zinc-400 hover:text-zinc-200'
              }`}
          >
            Results
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'list' && (
          <BenchmarkList
            benchmarks={benchmarks}
            loading={loading}
            onSelect={handleSelectBenchmark}
            onDelete={(id) => {
              setBenchmarks(benchmarks.filter(b => b.id !== id));
            }}
          />
        )}

        {view === 'create' && (
          <BenchmarkForm
            onSubmit={handleCreateBenchmark}
            loading={loading}
          />
        )}

        {view === 'results' && selectedBenchmark && (
          <BenchmarkResults
            benchmark={selectedBenchmark}
            onRefresh={() => benchmarksQuery.refetch()}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Benchmark List Component
 */
interface BenchmarkListProps {
  benchmarks: Benchmark[];
  loading: boolean;
  onSelect: (benchmark: Benchmark) => void;
  onDelete: (id: string) => void;
}

const BenchmarkList: React.FC<BenchmarkListProps> = ({
  benchmarks,
  loading,
  onSelect,
  // onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (benchmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400 mb-4">No benchmarks yet</p>
        <p className="text-sm text-zinc-500">
          Create a benchmark to compare AI models on the same prompt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {benchmarks.map(benchmark => (
        <div
          key={benchmark.id}
          className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer"
          onClick={() => onSelect(benchmark)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-white">{benchmark.name}</h3>
              <p className="text-sm text-zinc-400 mt-1 truncate">
                {benchmark.prompt}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                  {benchmark.type === 'text' ? '📝 Text' : '🖼️ Image'}
                </span>
                <span className="text-xs text-zinc-400">
                  {benchmark.models.length} models
                </span>
                <span className={`text-xs px-2 py-1 rounded ${benchmark.status === 'completed'
                  ? 'bg-green-500/20 text-green-300'
                  : benchmark.status === 'running'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  {benchmark.status}
                </span>
              </div>
            </div>
            {benchmark.isFavorite && (
              <span className="text-xl ml-4">⭐</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BenchmarkPanel;
