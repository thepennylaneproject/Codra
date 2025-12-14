/**
 * CLIENT-SIDE AI EXECUTOR
 * Calls Netlify Functions instead of direct provider APIs
 * Handles authentication via Supabase session
 */

import * as aiClient from './api-client';

export interface ExecutionOptions {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  provider?: string;
}

export interface ExecutionResult {
  content: string;
  model: string;
  provider: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latency: number;
}

export class ClientExecutor {
  /**
   * Execute a prompt and get the complete response
   */
  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const response = await aiClient.complete({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2000,
      topP: options.topP,
      provider: options.provider,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Execution failed');
    }

    const latency = Date.now() - startTime;

    return {
      content: response.data.content,
      model: response.data.model,
      provider: response.data.provider,
      tokens: {
        prompt: response.data.usage.promptTokens,
        completion: response.data.usage.completionTokens,
        total: response.data.usage.totalTokens,
      },
      cost: response.data.cost,
      latency,
    };
  }

  /**
   * Execute a prompt with streaming
   */
  async *executeStream(options: ExecutionOptions): AsyncGenerator<{
    type: string;
    content?: string;
    usage?: { promptTokens: number; completionTokens: number };
    cost?: number;
  }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    for await (const chunk of aiClient.streamComplete({
      model: options.model,
      messages,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 2000,
      topP: options.topP,
      provider: options.provider,
    })) {
      yield chunk;
    }
  }
}

// Singleton instance - no longer needs API key
let executor: ClientExecutor | null = null;

export function getExecutor(): ClientExecutor {
  if (!executor) {
    executor = new ClientExecutor();
  }
  return executor;
}

export function resetExecutor() {
  executor = null;
}
