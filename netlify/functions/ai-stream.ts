/**
 * Netlify Function: AI Stream Endpoint
 */

import { Handler } from '@netlify/functions';
import { AimlApiProvider } from '../../src/lib/ai/providers/aimlapi';
import { DeepSeekProvider } from '../../src/lib/ai/providers/deepseek';
import { GeminiProvider } from '../../src/lib/ai/providers/gemini';
import { OpenAIProvider } from '../../src/lib/ai/providers/openai';
import { MistralProvider } from '../../src/lib/ai/providers/mistral';
import { CohereProvider } from '../../src/lib/ai/providers/cohere';
import { HuggingFaceProvider } from '../../src/lib/ai/providers/huggingface';
import { AIRouter } from '../../src/lib/ai/router';
import type { AICompletionRequest } from '../../src/lib/ai/types';
import { logAIRunStart, logAIRunComplete } from './utils/telemetry-helpers';
import { getCredentialForProvider, verifyBearerToken } from './utils/credential-utils';


export const handler: Handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
                body: 'Method not allowed',
            };
        }

        let user: { id: string; email?: string };
        try {
            user = await verifyBearerToken(event.headers.authorization);
        } catch (authErr: unknown) {
            return {
                statusCode: 401,
                headers,
                body: `data: ${JSON.stringify({ error: (authErr as Error).message })}\n\n`,
            };
        }

        const body: AICompletionRequest = JSON.parse(event.body || '{}');

        const router = new AIRouter({
            primaryProvider: body.provider || 'aimlapi',
            fallbackProviders: ['openai', 'deepseek', 'gemini'],
        });

        // Register providers with Codra's platform API keys
        try {
            const aimlKey = getCredentialForProvider('aimlapi');
            router.registerProvider(new AimlApiProvider(aimlKey));
        } catch (e) {
            console.warn('aimlapi not available:', e);
        }

        try {
            const deepseekKey = getCredentialForProvider('deepseek');
            router.registerProvider(new DeepSeekProvider(deepseekKey));
        } catch (e) {
            console.warn('DeepSeek not available:', e);
        }

        try {
            const geminiKey = getCredentialForProvider('gemini');
            router.registerProvider(new GeminiProvider(geminiKey));
        } catch (e) {
            console.warn('Gemini not available:', e);
        }

        try {
            const openaiKey = getCredentialForProvider('openai');
            router.registerProvider(new OpenAIProvider(openaiKey));
        } catch (e) {
            console.warn('OpenAI not available:', e);
        }

        try {
            const mistralKey = getCredentialForProvider('mistral');
            router.registerProvider(new MistralProvider(mistralKey));
        } catch (e) {
            console.warn('Mistral not available:', e);
        }

        try {
            const cohereKey = getCredentialForProvider('cohere');
            router.registerProvider(new CohereProvider(cohereKey));
        } catch (e) {
            console.warn('Cohere not available:', e);
        }

        try {
            const hfKey = getCredentialForProvider('huggingface');
            router.registerProvider(new HuggingFaceProvider(hfKey));
        } catch (e) {
            console.warn('HuggingFace not available:', e);
        }

        // Log Run Start
        const runId = await logAIRunStart({
            userId: user.id,
            workspaceId: null,
            taskType: 'stream-completion',
            grounded: false,
            providerId: router.primaryProvider,
            modelId: body.model,
            estTokens: (body.messages || []).reduce((acc, m) => acc + m.content.length / 4, 0),
        });

        // Start streaming
        let body_to_return = '';
        let totalCost = 0;
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let usedProvider = '';
        let success = true;
        let errorMsg = '';

        try {
            for await (const chunk of router.streamComplete({
                model: body.model,
                messages: body.messages,
                temperature: body.temperature,
                maxTokens: body.maxTokens,
                provider: body.provider,
            })) {
                if (chunk.type === 'start') {
                    body_to_return += 'data: {"type":"start"}\n\n';
                    usedProvider = chunk.provider || usedProvider;
                } else if (chunk.type === 'content' && chunk.content) {
                    body_to_return += `data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`;
                } else if (chunk.type === 'end') {
                    totalCost = chunk.cost || 0;
                    totalPromptTokens = chunk.usage?.promptTokens || 0;
                    totalCompletionTokens = chunk.usage?.completionTokens || 0;
                }
            }
        } catch (e) {
            success = false;
            errorMsg = e instanceof Error ? e.message : String(e);
            throw e;
        } finally {
            if (runId) {
                await logAIRunComplete(runId, {
                    actualPromptTokens: totalPromptTokens,
                    actualCompletionTokens: totalCompletionTokens,
                    actualCostUsd: totalCost,
                    latencyMs: 0,
                    success,
                    errorMessageSafe: errorMsg,
                });
            }
        }

        body_to_return += `data: ${JSON.stringify({ type: 'end', usage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens }, cost: totalCost })}\n\n`;

        return {
            statusCode: 200,
            headers,
            body: body_to_return,
        };
    } catch (error) {
        console.error('Stream error:', error);
        return {
            statusCode: 500,
            headers,
            body: `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`,
        };
    }
};