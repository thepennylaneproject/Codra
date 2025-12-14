import { NodeExecutor, ExecutionContext, ValidationResult } from '../types';
import { AppNode } from '../../../types/flow';
import { getExecutor } from '../../ai/client-executor';

export const aiTextExecutor: NodeExecutor<AppNode> = {
    async execute(node: AppNode, inputs: Record<string, any>, _context: ExecutionContext) {
        try {
            const { prompt, model, temperature, maxTokens, systemPrompt } = node.data as {
                prompt?: string;
                model?: string;
                temperature?: number;
                maxTokens?: number;
                systemPrompt?: string;
            };

            // Resolve any template variables in the prompt
            const resolvedPrompt = typeof prompt === 'string'
                ? prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => inputs[key] || '')
                : prompt;

            const executor = getExecutor();
            const result = await executor.execute({
                model: model || 'gpt-4o',
                prompt: resolvedPrompt || '',
                systemPrompt,
                temperature: temperature || 0.7,
                maxTokens: maxTokens || 2000,
            });

            return {
                text: result.content,
                model: result.model,
                provider: result.provider,
                tokens: result.tokens.total,
                cost: result.cost,
                latency: result.latency,
            };
        } catch (error) {
            throw new Error(
                `AI Text execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    },

    validate(node: AppNode): ValidationResult {
        const { prompt, model } = node.data;
        const errors: string[] = [];

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            errors.push('Prompt is required');
        }

        if (!model || typeof model !== 'string') {
            errors.push('Model is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
};
