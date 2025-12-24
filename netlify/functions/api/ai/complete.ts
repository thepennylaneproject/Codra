/**
 * Netlify Function: AI Completion Endpoint
 * - Decrypts API keys from Supabase
 * - Routes to appropriate provider
 * - Returns completion result
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { AimlApiProvider } from '../../../../src/lib/ai/providers/aimlapi';
import { DeepSeekProvider } from '../../../../src/lib/ai/providers/deepseek';
import { GeminiProvider } from '../../../../src/lib/ai/providers/gemini';
import { OpenAIProvider } from '../../../../src/lib/ai/providers/openai';
import { MistralProvider } from '../../../../src/lib/ai/providers/mistral';
import { CohereProvider } from '../../../../src/lib/ai/providers/cohere';
import { HuggingFaceProvider } from '../../../../src/lib/ai/providers/huggingface';
import { AIRouter } from '../../../../src/lib/ai/router';
import type { AICompletionRequest, AICompletionResponse } from '../../../../src/lib/ai/types';

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function getCredentialForProvider(userId: string, provider: string): Promise<string> {
    const { data, error } = await supabase
        .from('api_credentials')
        .select('encrypted_key, iv, auth_tag')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('environment', process.env.NODE_ENV || 'development')
        .single();

    if (error || !data) {
        throw new Error(`No credentials found for provider: ${provider}`);
    }

    // Decrypt the key using the decryption function from Phase 3
    // Import your decryption utility
    const crypto = require('crypto');
    const userSecret = process.env.SUPABASE_USER_SECRET || '';

    // In production, derive the key from userId + app secret
    // For now, using a simplified approach
    const decryptionKey = crypto
        .createHash('sha256')
        .update(`${userId}:${userSecret}`)
        .digest();

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        decryptionKey,
        Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.auth_tag, 'hex'));

    let decrypted = decipher.update(data.encrypted_key, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

const handler: Handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

        // Get auth token from header
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

        // Parse request body
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

        // Initialize router
        const router = new AIRouter({
            primaryProvider: body.provider || 'aimlapi',
            fallbackProviders: ['openai', 'deepseek', 'gemini'],
        });

        // Register providers with decrypted keys
        try {
            const aimlKey = await getCredentialForProvider(user.id, 'aimlapi');
            router.registerProvider(new AimlApiProvider(aimlKey));
        } catch (e) {
            console.warn('aimlapi not available:', e);
        }

        try {
            const deepseekKey = await getCredentialForProvider(user.id, 'deepseek');
            router.registerProvider(new DeepSeekProvider(deepseekKey));
        } catch (e) {
            console.warn('DeepSeek not available:', e);
        }

        try {
            const geminiKey = await getCredentialForProvider(user.id, 'gemini');
            router.registerProvider(new GeminiProvider(geminiKey));
        } catch (e) {
            console.warn('Gemini not available:', e);
        }

        try {
            const openaiKey = await getCredentialForProvider(user.id, 'openai');
            router.registerProvider(new OpenAIProvider(openaiKey));
        } catch (e) {
            console.warn('OpenAI not available:', e);
        }

        try {
            const mistralKey = await getCredentialForProvider(user.id, 'mistral');
            router.registerProvider(new MistralProvider(mistralKey));
        } catch (e) {
            console.warn('Mistral not available:', e);
        }

        try {
            const cohereKey = await getCredentialForProvider(user.id, 'cohere');
            router.registerProvider(new CohereProvider(cohereKey));
        } catch (e) {
            console.warn('Cohere not available:', e);
        }

        try {
            const hfKey = await getCredentialForProvider(user.id, 'huggingface');
            router.registerProvider(new HuggingFaceProvider(hfKey));
        } catch (e) {
            console.warn('HuggingFace not available:', e);
        }

        // Execute completion
        const result = await router.complete({
            model: body.model,
            messages: body.messages,
            temperature: body.temperature,
            maxTokens: body.maxTokens,
            provider: body.provider,
        });

        // Log usage for cost tracking
        await supabase.from('usage_logs').insert({
            user_id: user.id,
            provider: result.provider,
            model: result.model,
            requests: 1,
            prompt_tokens: result.usage.promptTokens,
            completion_tokens: result.usage.completionTokens,
            cost: result.cost,
            timestamp: new Date().toISOString(),
        });

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

export { handler };