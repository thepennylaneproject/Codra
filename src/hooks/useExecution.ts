/**
 * USE EXECUTION HOOK
 * Provides easy-to-use execution interface with streaming support
 */

import { useState, useCallback } from 'react';
import { getExecutor } from '../lib/ai/client-executor';
import type { ExecutionOptions } from '../lib/ai/client-executor';

export interface ExecutionState {
  isExecuting: boolean;
  output: string;
  error: string | null;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  } | null;
  cost: number | null;
  latency: number | null;
}

/**
 * Hook for executing prompts with streaming support
 */
export function useExecution() {
  const [state, setState] = useState<ExecutionState>({
    isExecuting: false,
    output: '',
    error: null,
    tokens: null,
    cost: null,
    latency: null
  });

  /**
   * Execute a prompt without streaming
   */
  const execute = useCallback(async (options: ExecutionOptions) => {
    setState({
      isExecuting: true,
      output: '',
      error: null,
      tokens: null,
      cost: null,
      latency: null
    });

    try {
      const executor = getExecutor();
      const result = await executor.execute(options);

      setState({
        isExecuting: false,
        output: result.content,
        error: null,
        tokens: {
          prompt: result.tokens.prompt,
          completion: result.tokens.completion,
          total: result.tokens.total
        },
        cost: result.cost,
        latency: result.latency
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error
      }));
      throw err;
    }
  }, []);

  /**
   * Execute a prompt with streaming
   */
  const executeStream = useCallback(async (options: ExecutionOptions) => {
    setState({
      isExecuting: true,
      output: '',
      error: null,
      tokens: null,
      cost: null,
      latency: null
    });

    try {
      const executor = getExecutor();
      let fullOutput = '';
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let totalCost = 0;

      for await (const chunk of executor.executeStream(options)) {
        if (chunk.type === 'content' && chunk.content) {
          fullOutput += chunk.content;
          setState(prev => ({
            ...prev,
            output: fullOutput
          }));
        } else if (chunk.type === 'end') {
          totalPromptTokens = chunk.usage?.promptTokens ?? 0;
          totalCompletionTokens = chunk.usage?.completionTokens ?? 0;
          totalCost = chunk.cost ?? 0;
        }
      }

      setState({
        isExecuting: false,
        output: fullOutput,
        error: null,
        tokens: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalPromptTokens + totalCompletionTokens
        },
        cost: totalCost,
        latency: null // Streaming doesn't track latency easily
      });

      return {
        content: fullOutput,
        tokens: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalPromptTokens + totalCompletionTokens
        },
        cost: totalCost
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error
      }));
      throw err;
    }
  }, []);

  /**
   * Clear the execution state
   */
  const clear = useCallback(() => {
    setState({
      isExecuting: false,
      output: '',
      error: null,
      tokens: null,
      cost: null,
      latency: null
    });
  }, []);

  return {
    ...state,
    execute,
    executeStream,
    clear
  };
}
