/**
 * FORGE PANEL WITH STREAMING
 * Alternative version that uses streaming responses
 * This can replace the regular ForgePanel for real-time output
 */

import React, { useState } from 'react';
import {
  ForgeIcon,
  ExecuteIcon,
  LoadingIcon,
  SuccessIcon,
  ErrorIcon,
  CostIcon,
  ModelIcon
} from '../icons';
import { cn } from '../../lib/utils';
import { useExecution } from '../../hooks/useExecution';

interface ForgePanelStreamingProps {
  promptId?: string;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  onExecute?: (input: string, model: string) => Promise<void>;
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'meta-llama2-70b', name: 'Llama 2 70B', provider: 'Meta' },
];

export const ForgePanelStreaming: React.FC<ForgePanelStreamingProps> = ({
  selectedModel = 'gpt-4o',
  onModelChange,
  onExecute
}) => {
  const [input, setInput] = useState('');
  const [selectedModelInternal, setSelectedModelInternal] = useState(selectedModel);
  const { isExecuting, output, error, tokens, cost, executeStream } = useExecution();

  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModelInternal);

  const handleModelChange = (modelId: string) => {
    setSelectedModelInternal(modelId);
    onModelChange?.(modelId);
  };

  const handleExecute = async () => {
    if (!input.trim()) {
      alert('Please enter input text');
      return;
    }

    try {
      if (onExecute) {
        await onExecute(input, selectedModelInternal);
      }

      await executeStream({
        model: selectedModelInternal,
        prompt: input,
        temperature: 0.7,
        maxTokens: 2000,
        stream: true
      });
    } catch (err) {
      console.error('Execution failed:', err);
    }
  };

  const hasResult = output || error;

  return (
    <div className="h-full flex flex-col bg-background-elevated border-l border-border-subtle">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <ForgeIcon size={20} color="#D81159" />
          <h2 className="text-label-md text-cream font-semibold">FORGE</h2>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-label-sm text-text-muted">SELECT MODEL</label>
          <select
            value={selectedModelInternal}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={isExecuting}
            className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20 disabled:opacity-50"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Section */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <label className="text-label-sm text-text-muted mb-2 block">INPUT</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your prompt or data here..."
          disabled={isExecuting}
          className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20 resize-none h-24 disabled:opacity-50"
        />
      </div>

      {/* Execute Button */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <button
          onClick={handleExecute}
          disabled={isExecuting || !input.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-label-md font-semibold transition-all',
            isExecuting || !input.trim()
              ? 'bg-brand-magenta/40 text-text-muted cursor-not-allowed'
              : 'bg-brand-magenta text-background-default hover:brightness-110 glow-magenta'
          )}
        >
          {isExecuting ? (
            <>
              <LoadingIcon size={18} />
              Streaming...
            </>
          ) : (
            <>
              <ExecuteIcon size={18} />
              Execute
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto">
        {hasResult && (
          <div className="p-4 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              {!error && output && (
                <>
                  <SuccessIcon size={20} color="#10B981" />
                  <span className="text-label-sm text-state-success">Execution Successful</span>
                </>
              )}
              {error && (
                <>
                  <ErrorIcon size={20} color="#EF4444" />
                  <span className="text-label-sm text-state-error">Execution Failed</span>
                </>
              )}
              {isExecuting && (
                <>
                  <LoadingIcon size={20} color="#00D9D9" />
                  <span className="text-label-sm text-brand-teal">Streaming...</span>
                </>
              )}
            </div>

            {/* Output */}
            {output && (
              <div className="space-y-2">
                <label className="text-label-sm text-text-muted">OUTPUT</label>
                <div className="bg-background-default border border-border-subtle rounded-lg p-3 text-body-sm text-text-primary max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {output}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-state-error/10 border border-state-error/30 rounded-lg p-3 text-body-sm text-state-error">
                {error}
              </div>
            )}

            {/* Metadata */}
            {tokens && (
              <div className="space-y-2 pt-3 border-t border-border-subtle">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-text-muted">Model</span>
                  <span className="text-text-primary font-medium flex items-center gap-1">
                    <ModelIcon size={14} />
                    {selectedModelInfo?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-text-muted">Tokens</span>
                  <span className="text-text-primary font-medium">
                    {tokens.prompt}/{tokens.completion}/{tokens.total}
                  </span>
                </div>
                {cost !== null && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-muted">Cost</span>
                    <span className="text-brand-gold font-medium flex items-center gap-1">
                      <CostIcon size={14} />
                      ${cost.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasResult && !isExecuting && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <ForgeIcon size={40} color="#A8B0BB" className="mb-3 opacity-40" />
            <p className="text-text-muted text-body-sm">
              No executions yet.
            </p>
            <p className="text-text-soft text-body-sm mt-1">
              Enter input and execute to see results here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgePanelStreaming;
