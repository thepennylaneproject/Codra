/**
 * Task Executor Service
 * Handles real AI execution for Spread tasks
 */

import { SpreadTask } from '../../../domain/task-queue';
import { PromptContext } from '../../lyra/LyraPromptEngine';
import { getProviderById, getModelWithProvider } from '../registry/provider-registry';
import { ModelRegistryEntry } from '../registry/types';
import { AIProvider, AICompletionOptions } from '../types';
import { analytics } from '@/lib/analytics';

export interface TaskExecutionResult {
  taskId: string;
  output: string;
  memory: string;
  tokensUsed: number;
  cost: number;
  modelUsed: string;
  providerUsed: string;
  durationMs: number;
}

export interface TaskExecutionOptions {
  task: SpreadTask;
  prompt: string;
  context: PromptContext;
  modelId: string;
  providerId: string;
  onChunk?: (chunk: string) => void;
}

export class TaskExecutor {
  /**
   * Execute a Spread task with real AI
   */
  async executeTask(options: TaskExecutionOptions): Promise<TaskExecutionResult> {
    const { task, prompt, context, modelId, providerId } = options;
    const startTime = Date.now();

    analytics.track('flow_task_began', {
      taskId: task.id,
      taskType: task.title, // or determine type from task
      deskId: task.deskId,
    });

    try {
      // Get provider from registry
      const providerEntry = getProviderById(providerId);
      if (!providerEntry) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      // Get model info
      const modelResult = getModelWithProvider(modelId);
      const model = modelResult?.model;

      // Get the actual provider instance
      const provider: AIProvider | undefined  = (providerEntry as any).instance;
      if (!provider) {
        throw new Error(`Provider instance not available: ${providerId}`);
      }

      // Build messages
      const messages = [
        {
          role: 'system' as const,
          content: this.buildSystemPrompt(task, context)
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const temperature = this.getTemperatureForTask(task);
      const maxTokens = 2000; // Default token limit

      console.log(`[TaskExecutor] Executing task "${task.title}" with ${modelId} (${providerId})`);

      // Execute via provider
      const completionOptions: AICompletionOptions = {
        model: modelId,
        messages,
        temperature,
        maxTokens,
      };

      const result = await provider.complete(completionOptions);

      // Extract memory from output
      const memory = this.extractMemory(result.content, task);

      // Calculate cost
      const cost = this.calculateCost(result.usage, modelId, model);

      const executionResult: TaskExecutionResult = {
        taskId: task.id,
        output: result.content,
        memory,
        tokensUsed: result.usage?.totalTokens || 0,
        cost,
        modelUsed: modelId,
        providerUsed: providerId,
        durationMs: Date.now() - startTime,
      };

      analytics.track('flow_task_completed', {
        taskId: task.id,
        taskType: task.title,
        deskId: task.deskId,
        durationMs: executionResult.durationMs,
        modelUsed: executionResult.modelUsed,
        cost: executionResult.cost,
      });

      console.log(`[TaskExecutor] Task completed: ${result.usage?.totalTokens || 0} tokens, $${cost.toFixed(4)}, ${executionResult.durationMs}ms`);

      return executionResult;
    } catch (error) {
      analytics.track('flow_task_failed', {
        taskId: task.id,
        taskType: task.title,
        deskId: task.deskId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      console.error('[TaskExecutor] Execution failed:', error);
      throw new Error(`AI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute task with streaming (for real-time output)
   */
  async executeTaskStreaming(options: TaskExecutionOptions): Promise<TaskExecutionResult> {
    const { task, prompt, context, modelId, providerId, onChunk } = options;
    const startTime = Date.now();

    analytics.track('flow_task_began', {
      taskId: task.id,
      taskType: task.title,
      deskId: task.deskId,
    });

    try {
      // Get provider from registry
      const providerEntry = getProviderById(providerId);
      if (!providerEntry) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      // Get model info
      const modelResult = getModelWithProvider(modelId);
      const model = modelResult?.model;

      // Get the actual provider instance
      const provider: AIProvider | undefined = (providerEntry as any).instance;
      if (!provider || !provider.streamComplete) {
        throw new Error(`Provider does not support streaming: ${providerId}`);
      }

      const messages = [
        {
          role: 'system' as const,
          content: this.buildSystemPrompt(task, context)
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];

      const temperature = this.getTemperatureForTask(task);
      const maxTokens = 2000;

      let fullOutput = '';
      let totalTokens = 0;

      console.log(`[TaskExecutor] Streaming task "${task.title}" with ${modelId}`);

      // Stream via provider
      for await (const chunk of provider.streamComplete({
        model: modelId,
        messages,
        temperature,
        maxTokens,
      })) {
        fullOutput += chunk.content;
        totalTokens = chunk.usage?.totalTokens || totalTokens;
        
        // Call chunk callback for real-time updates
        if (onChunk) {
          onChunk(chunk.content || '');
        }
      }

      const memory = this.extractMemory(fullOutput, task);
      const cost = this.calculateCost({ totalTokens }, modelId, model);

      const executionResult: TaskExecutionResult = {
        taskId: task.id,
        output: fullOutput,
        memory,
        tokensUsed: totalTokens,
        cost,
        modelUsed: modelId,
        providerUsed: providerId,
        durationMs: Date.now() - startTime,
      };

      analytics.track('flow_task_completed', {
        taskId: task.id,
        taskType: task.title,
        deskId: task.deskId,
        durationMs: executionResult.durationMs,
        modelUsed: executionResult.modelUsed,
        cost: executionResult.cost,
      });

      return executionResult;
    } catch (error) {
      analytics.track('flow_task_failed', {
        taskId: task.id,
        taskType: task.title,
        deskId: task.deskId,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      console.error('[TaskExecutor] Streaming execution failed:', error);
      throw new Error(`Streaming execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt with project context
   */
  private buildSystemPrompt(task: SpreadTask, context: PromptContext): string {
    const brandVoice = context.brand?.voiceGuidelines || 'professional';
    const tone = 'neutral'; // Default tone as it's not in PromptContext directly

    return `You are Codra's ${task.deskId} desk assistant, an expert AI production team member.

PROJECT CONTEXT:
${JSON.stringify({
  projectName: context.projectName || 'Untitled',
  audience: context.audience || 'General',
  goals: context.deliverables?.map(d => d.name) || [],
}, null, 2)}

BRAND VOICE: ${brandVoice}
TONE: ${tone}

TASK: ${task.title}
${task.description}

OUTPUT REQUIREMENTS:
- Be ${tone} in tone
- Match brand voice: ${brandVoice}
- Deliver production-ready output
- Include a brief "memory" summary at the end (1-2 sentences) prefixed with "MEMORY:"
- Focus on actionable deliverables, not explanations

Generate the deliverable now.`;
  }

  /**
   * Determine optimal temperature for task type
   */
  private getTemperatureForTask(task: SpreadTask): number {
    const creativeTasks = ['design', 'write'];
    const technicalTasks = ['code', 'analyze'];
    
    if (creativeTasks.includes(task.deskId)) {
      return 0.8; // Higher temperature for creative tasks
    } else if (technicalTasks.includes(task.deskId)) {
      return 0.3; // Lower temperature for technical precision
    }
    
    return 0.5; // Balanced default
  }

  /**
   * Extract memory line from AI output
   */
  private extractMemory(output: string, task: SpreadTask): string {
    // Try to extract MEMORY: line
    const memoryMatch = output.match(/MEMORY:\s*(.+)/i);
    if (memoryMatch) {
      return memoryMatch[1].trim();
    }

    // Fallback: Generate memory from first 100 chars of output
    const preview = output.substring(0, 100).replace(/\n/g, ' ');
    return `${task.deskId}: ${preview}${output.length > 100 ? '...' : ''}`;
  }

  /**
   * Calculate cost based on token usage and model pricing
   */
  private calculateCost(usage: any, modelId: string, model?: ModelRegistryEntry): number {
    const tokens = usage?.totalTokens || 0;
    
    if (!tokens) return 0;

    // Use model's actual pricing if available
    if (model?.priceHint?.inputPer1k) {
      const avgPricePerToken = (model.priceHint.inputPer1k + (model.priceHint.outputPer1k || model.priceHint.inputPer1k)) / 2;
      return (tokens / 1000) * avgPricePerToken;
    }

    // Fallback to hardcoded pricing table
    const costsPerMillion: Record<string, number> = {
      'gpt-4o': 5.0,
      'gpt-4o-mini': 0.15,
      'claude-3-5-sonnet': 3.0,
      'claude-3-haiku': 0.25,
      'gemini-1.5-pro': 3.5,
      'gemini-1.5-flash': 0.075,
      'deepseek-chat': 0.27,
    };

    const costPerMillion = costsPerMillion[model?.id || modelId] || 1.0;
    return (tokens / 1_000_000) * costPerMillion;
  }

  /**
   * Validate task can be executed
   */
  validateTask(task: SpreadTask): { valid: boolean; error?: string } {
    if (!task.id || !task.title) {
      return { valid: false, error: 'Invalid task: missing id or title' };
    }

    if (!task.deskId) {
      return { valid: false, error: 'Invalid task: missing desk assignment' };
    }

    return { valid: true };
  }
}
