/**
 * FORGE PANEL
 * Right sidebar for executing prompts and managing AI model interactions
 * Part of the three-panel Codra studio layout
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
import { getExecutor } from '../../lib/ai/client-executor';
import { useExecutionHistory } from '../../hooks/useExecutionHistory';
import { costEngine } from '../../lib/ai/cost';
import { AgentSelectionState } from '../../lib/ai/types-agent-selector';
import AgentSelectorPanel from '../ai/AgentSelectorPanel';

interface ForgePanelProps {
  promptId?: string;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  onExecute?: (input: string, model: string) => Promise<void>;
}

interface ExecutionResult {
  status: 'success' | 'error' | 'pending';
  output?: string;
  error?: string;
  model?: string;
  provider?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  latency?: number;
  executedAt?: Date;
}

export const ForgePanel: React.FC<ForgePanelProps> = ({
  promptId,
  selectedModel = 'gpt-4o',
  onModelChange,
  onExecute
}) => {
  const [input, setInput] = useState('');
  const [selectedUpstreamProvider, setSelectedUpstreamProvider] = useState<string>('OpenAI');
  const [selectedModelInternal, setSelectedModelInternal] = useState(selectedModel);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  // Dynamic model state
  const [allModels, setAllModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [upstreamProviders, setUpstreamProviders] = useState<string[]>([]);

  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const { save: saveExecution } = useExecutionHistory(promptId);

  // Agent Selector state
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [agentSelection, setAgentSelection] = useState<AgentSelectionState>({ isRawModelMode: true });

  // Use static model list
  React.useEffect(() => {
    setIsLoadingModels(true);
    try {
      const staticModels = [
        // AIMLAPI models (200+ available)
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'aimlapi', contextWindow: 128000, costPer1kPrompt: 0.005, costPer1kCompletion: 0.015, capabilities: ['chat'] },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'aimlapi', contextWindow: 128000, costPer1kPrompt: 0.00015, costPer1kCompletion: 0.0006, capabilities: ['chat'] },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'aimlapi', contextWindow: 200000, costPer1kPrompt: 0.003, costPer1kCompletion: 0.015, capabilities: ['chat'] },
        { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', provider: 'aimlapi', contextWindow: 8000, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0003, capabilities: ['chat'] },
        { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B', provider: 'aimlapi', contextWindow: 32768, costPer1kPrompt: 0.000014, costPer1kCompletion: 0.000042, capabilities: ['chat'] },
        // DeepSeek models
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', contextWindow: 64000, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0002, capabilities: ['chat'] },
        { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', contextWindow: 4096, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0002, capabilities: ['code'] },
        // Gemini models
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'gemini', contextWindow: 1000000, costPer1kPrompt: 0.000075, costPer1kCompletion: 0.0003, capabilities: ['chat', 'vision'] },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', contextWindow: 1000000, costPer1kPrompt: 0.00125, costPer1kCompletion: 0.005, capabilities: ['chat', 'vision'] },
      ];

      setAllModels(staticModels);

      // Extract unique providers
      const providers = Array.from(new Set(staticModels.map(m => m.provider))).sort();
      setUpstreamProviders(providers);

      // Set default if needed
      if (providers.length > 0 && !providers.includes(selectedUpstreamProvider)) {
        setSelectedUpstreamProvider(providers[0]);
      }
    } catch (e) {
      console.error("Failed to initialize models", e);
      // Fallback to a minimal list
      setAllModels([
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'aimlapi', contextWindow: 128000, costPer1kPrompt: 0.005, costPer1kCompletion: 0.015, capabilities: ['chat'] }
      ]);
      setUpstreamProviders(['aimlapi']);
      setSelectedUpstreamProvider('aimlapi');
    }
    setIsLoadingModels(false);
  }, []);

  // Get models for selected upstream provider
  const availableModels = React.useMemo(() => {
    return allModels.filter(m => m.provider === selectedUpstreamProvider);
  }, [allModels, selectedUpstreamProvider]);

  // Effect to verify selected model is valid
  React.useEffect(() => {
    if (availableModels.length > 0) {
      const isValid = availableModels.find(m => m.id === selectedModelInternal);
      if (!isValid) {
        // Default to first choice
        setSelectedModelInternal(availableModels[0].id);
        onModelChange?.(availableModels[0].id);
      }
    }
  }, [availableModels, selectedModelInternal, onModelChange]);

  const handleProviderChange = (provider: string) => {
    setSelectedUpstreamProvider(provider);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelInternal(modelId);
    onModelChange?.(modelId);
  };

  // Handle agent selection changes
  const handleAgentSelectionChange = (selection: AgentSelectionState) => {
    setAgentSelection(selection);
    if (selection.modelId) {
      setSelectedModelInternal(selection.modelId);
      onModelChange?.(selection.modelId);
    }
  };

  // Calculate estimated cost
  const estimatedInputTokens = input.length / 4;
  const estimatedCost = costEngine.estimateCost(selectedModelInternal, estimatedInputTokens);

  const handleExecute = async () => {
    if (!input.trim()) {
      alert('Please enter input text');
      return;
    }

    setIsExecuting(true);
    setResult({ status: 'pending', output: '' });

    try {
      if (onExecute) {
        await onExecute(input, selectedModelInternal);
      }

      const executor = getExecutor();
      const executionResult = await executor.execute({
        model: selectedModelInternal,
        provider: selectedUpstreamProvider,
        prompt: input,
        temperature: 0.7,
        maxTokens: 2000
      });

      const finalResult: ExecutionResult = {
        status: 'success',
        output: executionResult.content,
        model: selectedModelInternal,
        provider: executionResult.provider,
        tokens: executionResult.tokens,
        cost: executionResult.cost,
        latency: executionResult.latency,
        executedAt: new Date()
      };

      setResult(finalResult);
      setExecutionHistory([finalResult, ...executionHistory.slice(0, 3)]);

      // Save to database (non-blocking)
      if (promptId) {
        saveExecution({
          promptId,
          model: selectedModelInternal,
          input,
          output: executionResult.content,
          tokens: executionResult.tokens,
          cost: executionResult.cost,
          latency: executionResult.latency,
          status: 'success'
        }).catch(err => {
          console.warn('Failed to save execution to database:', err);
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Execution failed';
      setResult({
        status: 'error',
        error: errorMessage,
        model: selectedModelInternal,
        provider: selectedUpstreamProvider
      });

      // Save error to database (non-blocking)
      if (promptId) {
        saveExecution({
          promptId,
          model: selectedModelInternal,
          input,
          output: '',
          tokens: { prompt: 0, completion: 0, total: 0 },
          cost: 0,
          latency: 0,
          status: 'error',
          error: errorMessage
        }).catch(err => {
          console.warn('Failed to save error to database:', err);
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-elevated border-l border-border-subtle">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ForgeIcon size={20} color="#D81159" />
            <h2 className="text-label-md text-cream font-semibold">FORGE</h2>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-background-subtle rounded-lg">
          <button
            onClick={() => setUseAdvancedMode(false)}
            className={cn(
              'flex-1 px-3 py-2 rounded text-label-xs font-medium transition-all',
              !useAdvancedMode
                ? 'bg-brand-magenta text-background-default'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            Task Mode
          </button>
          <button
            onClick={() => setUseAdvancedMode(true)}
            className={cn(
              'flex-1 px-3 py-2 rounded text-label-xs font-medium transition-all',
              useAdvancedMode
                ? 'bg-brand-magenta text-background-default'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            Advanced
          </button>
        </div>

        {/* Selection UI */}
        <div className="max-h-[400px] overflow-y-auto">
          {useAdvancedMode ? (
            // Advanced Mode: Original Provider/Model Dropdowns
            <div className="space-y-4">
              {/* Upstream Provider Selector */}
              <div className="space-y-2">
                <label className="text-label-sm text-text-muted">PROVIDER</label>
                <select
                  value={selectedUpstreamProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  disabled={isLoadingModels}
                  className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20 disabled:opacity-50"
                >
                  {upstreamProviders.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-label-sm text-text-muted">MODEL</label>
                  {isLoadingModels && <LoadingIcon size={14} className="animate-spin text-text-muted" />}
                </div>
                <select
                  value={selectedModelInternal}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={isLoadingModels || availableModels.length === 0}
                  className="w-full px-3 py-2 bg-background-default border border-border-subtle rounded-lg text-text-primary text-body-sm focus:outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/20 disabled:opacity-50"
                >
                  {availableModels.map((model: any) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            // Task Mode: New Agent Selector
            <AgentSelectorPanel
              onSelectionChange={handleAgentSelectionChange}
              initialSelection={agentSelection}
              availableModels={allModels}
              isLoadingModels={isLoadingModels}
            />
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <label className="text-label-sm text-text-muted">INPUT</label>
          {input.length > 0 && (
            <span className="text-label-xs text-brand-gold flex items-center gap-1">
              <CostIcon size={12} />
              ~${estimatedCost.toFixed(6)}
            </span>
          )}
        </div>
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
              Executing...
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
        {result && (
          <div className="p-4 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              {result.status === 'success' && (
                <>
                  <SuccessIcon size={20} color="#10B981" />
                  <span className="text-label-sm text-state-success">Execution Successful</span>
                </>
              )}
              {result.status === 'error' && (
                <>
                  <ErrorIcon size={20} color="#EF4444" />
                  <span className="text-label-sm text-state-error">Execution Failed</span>
                </>
              )}
              {result.status === 'pending' && (
                <>
                  <LoadingIcon size={20} color="#00D9D9" />
                  <span className="text-label-sm text-brand-teal">Executing...</span>
                </>
              )}
            </div>

            {/* Output */}
            {result.output && (
              <div className="space-y-2">
                <label className="text-label-sm text-text-muted">OUTPUT</label>
                <div className="bg-background-default border border-border-subtle rounded-lg p-3 text-body-sm text-text-primary max-h-32 overflow-y-auto">
                  {result.output}
                </div>
              </div>
            )}

            {/* Error */}
            {result.error && (
              <div className="bg-state-error/10 border border-state-error/30 rounded-lg p-3 text-body-sm text-state-error">
                {result.error}
              </div>
            )}

            {/* Metadata */}
            {result.tokens !== undefined && (
              <div className="space-y-2 pt-3 border-t border-border-subtle">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-text-muted">Provider</span>
                  <span className="text-text-primary font-medium">
                    {result.provider}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-text-muted">Model</span>
                  <span className="text-text-primary font-medium flex items-center gap-1">
                    <ModelIcon size={14} />
                    {allModels.find((m: any) => m.id === result.model)?.name ?? result.model}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-text-muted">Tokens</span>
                  <span className="text-text-primary font-medium">
                    {typeof result.tokens === 'number'
                      ? result.tokens
                      : `${result.tokens.prompt}/${result.tokens.completion}/${result.tokens.total}`}
                  </span>
                </div>
                {result.latency !== undefined && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-muted">Latency</span>
                    <span className="text-text-primary font-medium">{result.latency}ms</span>
                  </div>
                )}
                {result.cost !== undefined && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-muted">Cost</span>
                    <span className="text-brand-gold font-medium flex items-center gap-1">
                      <CostIcon size={14} />
                      ${result.cost.toFixed(6)}
                    </span>
                  </div>
                )}
                {result.executedAt && (
                  <div className="text-body-sm text-text-muted">
                    {result.executedAt.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <ForgeIcon size={40} color="#A8B0BB" className="mb-3 opacity-40" />
            <p className="text-text-muted text-body-sm">
              No executions yet.
            </p>
            <p className="text-text-soft text-body-sm mt-1">
              Select a provider and model to start executing.
            </p>
          </div>
        )}
      </div>

      {/* History Footer */}
      {executionHistory.length > 0 && (
        <div className="border-t border-border-subtle p-3">
          <div className="text-label-sm text-text-muted mb-2">RECENT EXECUTIONS</div>
          <div className="space-y-2 max-h-20 overflow-y-auto">
            {executionHistory.slice(0, 3).map((exec, idx) => (
              <button
                key={idx}
                onClick={() => setResult(exec)}
                className="w-full text-left px-3 py-2 rounded-lg bg-background-default hover:bg-background-subtle border border-border-subtle text-body-sm text-text-primary transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">
                    {allModels.find((m: any) => m.id === exec.model)?.name || exec.model}
                  </span>
                  {exec.status === 'success' && <SuccessIcon size={14} color="#10B981" />}
                  {exec.status === 'error' && <ErrorIcon size={14} color="#EF4444" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgePanel;
