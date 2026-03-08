/**
 * Netlify Function: AI Completion Endpoint
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { AimlApiProvider } from '../../src/lib/ai/providers/aimlapi';
import { DeepSeekProvider } from '../../src/lib/ai/providers/deepseek';
import { GeminiProvider } from '../../src/lib/ai/providers/gemini';
import { OpenAIProvider } from '../../src/lib/ai/providers/openai';
import { MistralProvider } from '../../src/lib/ai/providers/mistral';
import { CohereProvider } from '../../src/lib/ai/providers/cohere';
import { HuggingFaceProvider } from '../../src/lib/ai/providers/huggingface';
import { AIRouter } from '../../src/lib/ai/router';
import type { AICompletionRequest, AICompletionResponse } from '../../src/lib/ai/types';
import { logAIRunStart, logAIRunComplete } from './utils/telemetry-helpers';

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Get API key for a provider from Codra's platform environment variables.
 * Codra uses a platform-key model where all users share Codra's API keys,
 * and usage is tracked per-user for billing purposes.
 */
function getCredentialForProvider(provider: string): string {
    const envVarMap: Record<string, string> = {
        'aimlapi': 'AIMLAPI_API_KEY',
        'deepseek': 'DEEPSEEK_API_KEY',
        'gemini': 'GEMINI_API_KEY',
        'openai': 'OPENAI_API_KEY',
        'anthropic': 'ANTHROPIC_API_KEY',
        'mistral': 'MISTRAL_API_KEY',
        'cohere': 'COHERE_API_KEY_PROD',
        'huggingface': 'HUGGINGFACE_API_KEY',
        'deepai': 'DEEPAI_API_KEY',
    };

    const envVarName = envVarMap[provider];
    if (!envVarName) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    const apiKey = process.env[envVarName];
    if (!apiKey) {
        throw new Error(`Missing environment variable: ${envVarName}`);
    }

    return apiKey;
}

export const handler: Handler = async (event, context) => {
    // CORS headers — process.env.URL is set automatically by Netlify in deployed environments
    const headers = {
        'Access-Control-Allow-Origin': process.env.URL || process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
        };
    }

    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ success: false, error: 'Method not allowed' }),
            };
        }

        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, error: 'Unauthorized' }),
            };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, error: 'Invalid token' }),
            };
        }

        const body: AICompletionRequest = JSON.parse(event.body || '{}');

        if (!body.model || !body.messages) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: model, messages',
                }),
            };
        }

        const router = new AIRouter({
            primaryProvider: body.provider || 'aimlapi',
            fallbackProviders: ['openai', 'deepseek', 'gemini'],
        });

        const registrationErrors: string[] = [];

        // Register providers with Codra's platform API keys
        try {
            const aimlKey = getCredentialForProvider('aimlapi');
            router.registerProvider(new AimlApiProvider(aimlKey));
        } catch (e) {
            const msg = `aimlapi: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        try {
            const deepseekKey = getCredentialForProvider('deepseek');
            router.registerProvider(new DeepSeekProvider(deepseekKey));
        } catch (e) {
            const msg = `deepseek: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        try {
            const geminiKey = getCredentialForProvider('gemini');
            router.registerProvider(new GeminiProvider(geminiKey));
        } catch (e) {
            const msg = `gemini: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        try {
            const openaiKey = getCredentialForProvider('openai');
            router.registerProvider(new OpenAIProvider(openaiKey));
        } catch (e) {
            const msg = `openai: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        try {
            const mistralKey = getCredentialForProvider('mistral');
            router.registerProvider(new MistralProvider(mistralKey));
        } catch (e) {
            const msg = `mistral: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        try {
            const cohereKey = getCredentialForProvider('cohere');
            router.registerProvider(new CohereProvider(cohereKey));
        } catch (e) {
            const msg = `cohere: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        try {
            const hfKey = getCredentialForProvider('huggingface');
            router.registerProvider(new HuggingFaceProvider(hfKey));
        } catch (e) {
            const msg = `huggingface: ${e instanceof Error ? e.message : String(e)}`;
            console.warn(msg);
            registrationErrors.push(msg);
        }

        // ARCH-006: Check if ALL providers failed to register
        // There are 7 providers configured in the try-catch blocks above
        if (registrationErrors.length >= 7) {
            return {
                statusCode: 503,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'All AI providers unavailable',
                    details: registrationErrors,
                }),
            };
        }

        // Log Run Start
        const runId = await logAIRunStart({
            userId: user.id,
            workspaceId: event.headers['x-workspace-id'] || null,
            taskType: 'completion',
            grounded: false,
            providerId: router.primaryProvider,
            modelId: body.model,
            // ARCH-007: Safe token estimation handling array content
            estTokens: (body.messages || []).reduce((acc, m) => {
                const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                return acc + content.length / 4;
            }, 0),
            sourcesCount: 0,
        });

        // Execute completion
        let result;
        try {
            result = await router.complete({
                model: body.model,
                messages: body.messages,
                temperature: body.temperature,
                maxTokens: body.maxTokens,
                provider: body.provider,
            });
        } catch (e) {
            // ARCH-008: Log partial cost if available
            const partialCost = (e as any).partialCost || 0;
            const partialPromptTokens = (e as any).promptTokens || 0;

            if (runId) {
                await logAIRunComplete(runId, {
                    actualPromptTokens: partialPromptTokens,
                    actualCompletionTokens: 0,
                    actualCostUsd: partialCost,
                    latencyMs: 0,
                    success: false,
                    errorMessageSafe: e instanceof Error ? e.message : String(e),
                });
            }
            throw new Error(`AI Router Error: ${e instanceof Error ? e.message : String(e)}. Registration Errors: ${registrationErrors.join(' | ')}`);
        }

        // Log Run Completion
        if (runId) {
            await logAIRunComplete(runId, {
                actualPromptTokens: result.usage.promptTokens,
                actualCompletionTokens: result.usage.completionTokens,
                actualCostUsd: result.cost,
                latencyMs: 0, // Router doesn't return latency yet, defaulting
                success: true,
            });
        }

        const response: AICompletionResponse = {
            success: true,
            data: result,
            provider: result.provider,
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };
    } catch (error) {
        console.error('Completion error:', error);

        const response: AICompletionResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify(response),
        };
    }
};