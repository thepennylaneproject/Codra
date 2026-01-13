/**
 * Task Executor Service
 * Handles real AI execution for Spread tasks
 */

import { SpreadTask } from '../../../domain/task-queue';
import { PromptContext } from '../../lyra/LyraPromptEngine';
import type { AICompletionOptions as _AICompletionOptions, AIStreamChunk as _AIStreamChunk } from '../types';
import { analytics } from '@/lib/analytics';
import { getExecutor } from '../client-executor';
import type { ModelRegistryEntry as _ModelRegistryEntry } from '../registry/types';

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

export type ExecutionMode = 'preview' | 'execute';

export interface TaskExecutionOptions {
  task: SpreadTask;
  prompt: string;
  context: PromptContext;
  modelId: string;
  providerId: string;
  mode?: ExecutionMode;
  onChunk?: (chunk: string) => void;
}

export class TaskExecutor {
  /**
   * Execute a Spread task with real AI
   */
  async executeTask(options: TaskExecutionOptions): Promise<TaskExecutionResult> {
    const { task, prompt, context, modelId, providerId, mode = 'execute' } = options;
    const startTime = Date.now();

    if (mode === 'execute') {
      analytics.track('flow_task_began', {
        taskId: task.id,
        taskType: task.title,
        deskId: task.deskId,
      });
    }

    try {
      // Use ClientExecutor instead of direct provider instances
      const executor = getExecutor();
      
      const temperature = this.getTemperatureForTask(task, mode);
      const maxTokens = 2000; // Default token limit

      console.log(`[TaskExecutor] Executing task "${task.title}" with ${modelId} (${providerId})`);

      // Execute via ClientExecutor (which calls Netlify Functions)
      const result = await executor.execute({
        model: modelId,
        prompt,
        systemPrompt: this.buildSystemPrompt(task, context),
        temperature,
        maxTokens,
        provider: providerId,
      });

      // Extract memory from output
      const memory = this.extractMemory(result.content, task);

      // Calculate cost (ClientExecutor already returns cost)
      const cost = result.cost;

      const executionResult: TaskExecutionResult = {
        taskId: task.id,
        output: result.content,
        memory,
        tokensUsed: result.tokens.total,
        cost,
        modelUsed: result.model,
        providerUsed: result.provider,
        durationMs: Date.now() - startTime,
      };

      if (mode === 'execute') {
        analytics.track('flow_task_completed', {
          taskId: task.id,
          taskType: task.title,
          deskId: task.deskId,
          durationMs: executionResult.durationMs,
          modelUsed: executionResult.modelUsed,
          cost: executionResult.cost,
        });
      }

      console.log(`[TaskExecutor] Task completed: ${result.tokens.total} tokens, $${cost.toFixed(4)}, ${executionResult.durationMs}ms`);

      return executionResult;
    } catch (error) {
      if (mode === 'execute') {
        analytics.track('flow_task_failed', {
          taskId: task.id,
          taskType: task.title,
          deskId: task.deskId,
          error: error instanceof Error ? error.message : 'Unknown error',
          durationMs: Date.now() - startTime,
        });
      }
      console.error('[TaskExecutor] Execution failed:', error);
      throw new Error(`AI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute task with streaming (for real-time output)
   */
  async executeTaskStreaming(options: TaskExecutionOptions): Promise<TaskExecutionResult> {
    const { task, prompt, context, modelId, providerId, onChunk, mode = 'execute' } = options;
    const startTime = Date.now();

    if (mode === 'execute') {
      analytics.track('flow_task_began', {
        taskId: task.id,
        taskType: task.title,
        deskId: task.deskId,
      });
    }

    try {
      // Use ClientExecutor instead of direct provider instances
      const executor = getExecutor();
      
      const temperature = this.getTemperatureForTask(task, mode);
      const maxTokens = 2000;

      let fullOutput = '';
      let totalTokens = 0;
      let totalCost = 0;

      // Stream via ClientExecutor
      for await (const chunk of executor.executeStream({
        model: modelId,
        prompt,
        systemPrompt: this.buildSystemPrompt(task, context),
        temperature,
        maxTokens,
        provider: providerId,
      })) {
        if (chunk.type === 'content' && chunk.content) {
          fullOutput += chunk.content;
          // Call chunk callback for real-time updates
          if (onChunk) {
            onChunk(chunk.content);
          }
        } else if (chunk.type === 'end') {
          totalTokens = chunk.usage?.totalTokens || totalTokens;
          totalCost = chunk.cost || totalCost;
        }
      }

      const memory = this.extractMemory(fullOutput, task);
      const cost = totalCost;

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

      if (mode === 'execute') {
        analytics.track('flow_task_completed', {
          taskId: task.id,
          taskType: task.title,
          deskId: task.deskId,
          durationMs: executionResult.durationMs,
          modelUsed: executionResult.modelUsed,
          cost: executionResult.cost,
        });
      }

      return executionResult;
    } catch (error) {
      if (mode === 'execute') {
        analytics.track('flow_task_failed', {
          taskId: task.id,
          taskType: task.title,
          deskId: task.deskId,
          error: error instanceof Error ? error.message : 'Unknown error',
          durationMs: Date.now() - startTime,
        });
      }
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
  private getTemperatureForTask(task: SpreadTask, mode: ExecutionMode): number {
    if (mode === 'preview') {
      return 0;
    }
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
