/**
 * Netlify Function: AI Stream Endpoint
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
import type { AICompletionRequest } from '../../src/lib/ai/types';

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

        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: 'data: {"error":"Unauthorized"}\n\n',
            };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return {
                statusCode: 401,
                headers,
                body: 'data: {"error":"Invalid token"}\n\n',
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

        // Start streaming
        let body_to_return = '';
        let totalCost = 0;
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let usedProvider = '';

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

        // Log usage
        try {
            await supabase.from('usage_logs').insert({
                user_id: user.id,
                provider: usedProvider,
                model: body.model,
                requests: 1,
                prompt_tokens: totalPromptTokens,
                completion_tokens: totalCompletionTokens,
                cost: totalCost,
                timestamp: new Date().toISOString(),
            });
        } catch (e) {
            console.error('Failed to log usage:', e);
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