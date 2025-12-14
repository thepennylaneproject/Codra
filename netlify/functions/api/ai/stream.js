/**
 * Netlify Function: AI Stream Endpoint
 * Returns SSE (Server-Sent Events) stream
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { AimlApiProvider } from '../../../../src/lib/ai/providers/aimlapi';
import { DeepSeekProvider } from '../../../../src/lib/ai/providers/deepseek';
import { GeminiProvider } from '../../../../src/lib/ai/providers/gemini';
import { AIRouter } from '../../../../src/lib/ai/router';
import type { AICompletionRequest } from '../../../../src/lib/ai/types';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function getCredentialForProvider(userId: string, provider: string): Promise<string> {
    // Same decryption logic as complete.ts
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

    const crypto = require('crypto');
    const userSecret = process.env.SUPABASE_USER_SECRET || '';
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

        if (!body.model || !body.messages) {
            return {
                statusCode: 400,
                headers,
                body: 'data: {"error":"Missing required fields"}\n\n',
            };
        }

        // Initialize router
        const router = new AIRouter({
            primaryProvider: 'aimlapi',
            fallbackProviders: ['deepseek', 'gemini'],
        });

        // Register providers
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

export { handler };