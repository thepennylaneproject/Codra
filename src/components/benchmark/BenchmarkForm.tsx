// src/components/benchmark/BenchmarkForm.tsx
/**
 * Benchmark Form - Create new benchmark
 */

import React, { useState } from 'react';
// import { ModelSelector } from './ModelSelector';

interface BenchmarkFormProps {
  onSubmit: (
    name: string,
    prompt: string,
    type: 'text' | 'image',
    models: string[],
    parameters?: any
  ) => Promise<void>;
  loading: boolean;
}

export const BenchmarkForm: React.FC<BenchmarkFormProps> = ({ onSubmit, loading }) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'text' | 'image'>('text');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !prompt || selectedModels.length < 2) {
      alert('Please fill in all fields and select at least 2 models');
      return;
    }

    await onSubmit(name, prompt, type, selectedModels, {
      temperature,
      maxTokens,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Benchmark Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Code Generation Comparison"
          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Prompt to Compare
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter the prompt you want to test all models with..."
          rows={6}
          className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
        <p className="text-xs text-zinc-400 mt-2">
          This prompt will be sent to all selected models
        </p>
      </div>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Benchmark Type
        </label>
        <div className="flex gap-3">
          {(['text', 'image'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded transition-colors ${type === t
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
            >
              {t === 'text' ? '📝 Text Models' : '🖼️ Image Models'}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Models to Compare ({selectedModels.length})
        </label>
        <ModelSelector
          type={type}
          selectedModels={selectedModels}
          onSelectModels={setSelectedModels}
        />
        <p className="text-xs text-zinc-400 mt-2">
          Select 2-5 models. Using aimlapi models saves 50% with batch processing.
        </p>
      </div>

      {/* Parameters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-4">
        <h3 className="text-sm font-medium text-white">Advanced Parameters</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Temperature: {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Max Tokens: {maxTokens}
            </label>
            <input
              type="range"
              min="256"
              max="4096"
              step="256"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Maximum response length
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || selectedModels.length < 2}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 text-white rounded font-medium transition-colors"
        >
          {loading ? 'Starting Benchmark...' : 'Start Benchmark'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-200">
        <strong>💡 Tip:</strong> Benchmarks using only aimlapi models use the batch API,
        saving you 50% on costs while getting results in parallel.
      </div>
    </form>
  );
};

// ============================================================================
// Benchmark Results Component
// ============================================================================

import type { Benchmark } from '../../lib/ai/types-benchmark';

interface BenchmarkResultsProps {
  benchmark: Benchmark;
  onRefresh: () => void;
}

export const BenchmarkResults: React.FC<BenchmarkResultsProps> = ({
  benchmark,
  onRefresh,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(benchmark.status === 'running');
  const [, setRefreshInterval] = React.useState<NodeJS.Timeout>();

  React.useEffect(() => {
    if (autoRefresh && benchmark.status === 'running') {
      const interval = setInterval(onRefresh, 3000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, benchmark.status, onRefresh]);

  const isRunning = benchmark.status === 'running';
  const isCompleted = benchmark.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{benchmark.name}</h3>
          <p className="text-sm text-zinc-400 mt-1">{benchmark.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 text-zinc-300 transition-colors"
          >
            🔄 Refresh
          </button>
          {isRunning && (
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded transition-colors ${autoRefresh
                ? 'bg-green-600/20 text-green-300 border border-green-600/50'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                }`}
            >
              {autoRefresh ? '⏸️ Auto' : '▶️ Auto'}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-300">Running benchmark...</p>
            <p className="text-sm font-medium text-indigo-400">
              {benchmark.progress.current}/{benchmark.progress.total} models
            </p>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
              style={{
                width: `${(benchmark.progress.current / benchmark.progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Results Grid */}
      {isCompleted && benchmark.results.length > 0 && (
        <>
          {/* Summary */}
          {benchmark.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400">Total Cost</p>
                <p className="text-xl font-semibold text-white mt-1">
                  ${benchmark.summary.totalCost.toFixed(4)}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400">Avg Latency</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {Math.round(benchmark.summary.avgLatency)}ms
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400">Models</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {benchmark.summary.totalResults}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400">Winner</p>
                <p className="text-sm font-semibold text-indigo-300 mt-1 truncate">
                  {benchmark.summary.winner || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Results Cards */}
          <div className="space-y-3">
            {benchmark.results.map((result, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white">{result.model}</h4>
                    <p className="text-xs text-zinc-400">{result.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-300">
                      ${result.metrics.cost.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-zinc-400">Latency</p>
                    <p className="text-sm font-medium text-white">
                      {result.metrics.latency}ms
                    </p>
                  </div>
                  {result.metrics.tokens && (
                    <div>
                      <p className="text-xs text-zinc-400">Tokens</p>
                      <p className="text-sm font-medium text-white">
                        {result.metrics.tokens}
                      </p>
                    </div>
                  )}
                </div>

                {typeof result.output === 'string' && (
                  <div className="bg-zinc-800/50 rounded p-3 max-h-32 overflow-y-auto">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {result.output.slice(0, 200)}
                      {result.output.length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {benchmark.summary?.recommendations && (
            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-600/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Recommendations</h4>
              <div className="space-y-2">
                {benchmark.summary.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="inline-block bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-xs mr-2 font-medium">
                      {rec.category.toUpperCase()}
                    </span>
                    <span className="text-zinc-300">{rec.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export */}
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:border-zinc-700 transition-colors text-sm">
              📥 Export JSON
            </button>
            <button className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:border-zinc-700 transition-colors text-sm">
              📊 Export CSV
            </button>
            <button className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:border-zinc-700 transition-colors text-sm">
              ⭐ Add to Favorites
            </button>
          </div>
        </>
      )}

      {!isRunning && !isCompleted && (
        <div className="text-center py-8 text-zinc-400">
          Benchmark not yet started
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Model Selector Component
// ============================================================================

interface ModelSelectorProps {
  type: 'text' | 'image';
  selectedModels: string[];
  onSelectModels: (models: string[]) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  type,
  selectedModels,
  onSelectModels,
}) => {
  const textModels = [
    { id: 'gpt-4o', name: 'GPT-4 Optimized', provider: 'openai' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'deepseek-chat', name: 'DeepSeek', provider: 'deepseek' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    { id: 'mistral-large', name: 'Mistral Large', provider: 'aimlapi' },
  ];

  const imageModels = [
    { id: 'dall-e-3', name: 'DALL-E 3', provider: 'aimlapi' },
    { id: 'flux-pro', name: 'Flux Pro', provider: 'aimlapi' },
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'aimlapi' },
  ];

  const models = type === 'text' ? textModels : imageModels;

  return (
    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
      {models.map(model => (
        <button
          key={model.id}
          type="button"
          onClick={() => {
            if (selectedModels.includes(model.id)) {
              onSelectModels(selectedModels.filter(m => m !== model.id));
            } else if (selectedModels.length < 5) {
              onSelectModels([...selectedModels, model.id]);
            }
          }}
          className={`p-3 rounded border transition-colors text-left ${selectedModels.includes(model.id)
            ? 'bg-indigo-600/20 border-indigo-600/50 text-indigo-200'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
        >
          <div className="font-medium text-sm">{model.name}</div>
          <div className="text-xs text-zinc-400 mt-1">{model.provider}</div>
          {selectedModels.includes(model.id) && (
            <div className="mt-2 text-xs">✓ Selected</div>
          )}
        </button>
      ))}
    </div>
  );
};

export default BenchmarkForm;
