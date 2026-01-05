/**
 * Netlify Function: Suggest Names
 * Uses AI to suggest names based on project context and naming rules
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { AimlApiProvider } from '../../../../src/lib/ai/providers/aimlapi';
import { DeepSeekProvider } from '../../../../src/lib/ai/providers/deepseek';
import { GeminiProvider } from '../../../../src/lib/ai/providers/gemini';
import { AIRouter } from '../../../../src/lib/ai/router';
import type { AICompletionResponse, AIMessage } from '../../../../src/lib/ai/types';

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper to get credentials (duplicated from complete.ts to ensure independence)
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

export const handler: Handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Auth check
        const authHeader = event.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
        }

        // Parse body
        const body = JSON.parse(event.body || '{}');
        const { projectId, kind, scope, description, existingNames, count = 3 } = body;

        if (!projectId || !kind || !scope) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Prepare prompt
        const systemPrompt = `You are a naming expert for software projects.
Your goal is to suggest names for a "${kind}" in the scope of "${scope}".
Context:
- Description: ${description}
- Project ID: ${projectId}
- Existing names to avoid: ${existingNames?.join(', ') || 'None'}

Return ONLY a JSON array of objects with the following format:
[
  { "name": "...", "reasoning": "..." }
]
Ensure names follow standard conventions for ${scope} ${kind}.
Do not include any markdown or extra text.`;

        const messages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Suggest ${count} names for ${description || kind}` }
        ];

        // Initialize router and providers
        const router = new AIRouter({
            primaryProvider: 'aimlapi',
            fallbackProviders: ['deepseek', 'gemini'],
        });

        // Try to register available providers
        try {
            const aimlKey = await getCredentialForProvider(user.id, 'aimlapi');
            router.registerProvider(new AimlApiProvider(aimlKey));
        } catch (e) { }

        try {
            const deepseekKey = await getCredentialForProvider(user.id, 'deepseek');
            router.registerProvider(new DeepSeekProvider(deepseekKey));
        } catch (e) { }

        try {
            const geminiKey = await getCredentialForProvider(user.id, 'gemini');
            router.registerProvider(new GeminiProvider(geminiKey));
        } catch (e) { }

        // Execute
        const result = await router.complete({
            model: 'gpt-4o', // Defaulting to a high quality model
            messages,
            temperature: 0.7,
            maxTokens: 500,
        });

        // Parse result
        let content = result.content;
        // Clean up potential markdown code blocks
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let suggestions;
        try {
            suggestions = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            throw new Error('AI returned invalid format');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ suggestions }),
        };

    } catch (error) {
        console.error('Error suggesting names:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
        };
    }
};
