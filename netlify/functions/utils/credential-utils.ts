/**
 * Shared utilities for Netlify function authentication and credential access.
 *
 * Codra uses a platform-key model: all users share Codra's AI provider API
 * keys, and usage is tracked per-user for billing purposes via telemetry.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Supabase client ──────────────────────────────────────────────────────────

/** Lazily-initialised singleton Supabase admin client shared across functions. */
let _supabase: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (!_supabase) {
        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
        _supabase = createClient(url, key);
    }
    return _supabase;
}

// ─── JWT verification ─────────────────────────────────────────────────────────

export interface AuthResult {
    id: string;
    email?: string;
}

/**
 * Verifies a Supabase Bearer JWT from the `Authorization` header.
 * Returns the authenticated user's ID on success, or throws with a
 * human-safe message on failure.
 */
export async function verifyBearerToken(
    authHeader: string | undefined,
): Promise<AuthResult> {
    if (!authHeader?.startsWith('Bearer ')) {
        throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);

    if (error || !user) {
        throw Object.assign(new Error('Invalid token'), { statusCode: 401 });
    }

    return { id: user.id, email: user.email };
}

// ─── Provider credentials ─────────────────────────────────────────────────────

const PROVIDER_ENV_MAP: Record<string, string> = {
    aimlapi: 'AIMLAPI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    gemini: 'GEMINI_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    cohere: 'COHERE_API_KEY_PROD',
    huggingface: 'HUGGINGFACE_API_KEY',
    deepai: 'DEEPAI_API_KEY',
};

/**
 * Returns the platform API key for the given AI provider.
 * Throws if the provider is unknown or the environment variable is unset.
 */
export function getCredentialForProvider(provider: string): string {
    const envVarName = PROVIDER_ENV_MAP[provider];
    if (!envVarName) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    const apiKey = process.env[envVarName];
    if (!apiKey) {
        throw new Error(`Missing environment variable: ${envVarName}`);
    }

    return apiKey;
}
