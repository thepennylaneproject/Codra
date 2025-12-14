/**
 * Provider Registry Endpoint
 * 
 * Returns the full provider+model registry without exposing secrets.
 * This endpoint is public and does not require authentication.
 * 
 * GET /.netlify/functions/providers
 * 
 * Returns:
 * {
 *   "providers": Array<{
 *     "id": string,
 *     "displayName": string,
 *     "modalities": string[],
 *     "supportsStreaming": boolean,
 *     "models": Array<{
 *       "id": string,
 *       "displayName": string,
 *       "modalities": string[],
 *       "contextWindow": number,
 *       "priceHint"?: { "inputPer1k": number, "outputPer1k": number } | null,
 *       "latencyHintMs"?: number | null,
 *       "tags"?: string[]
 *     }>
 *   }>
 * }
 */

import { Handler } from '@netlify/functions';
import { PROVIDER_REGISTRY } from '../../src/lib/ai/registry/provider-registry';
import { ProviderRegistryResponse, ProviderRegistryErrorResponse } from '../../src/lib/ai/registry/types';

// --- CORS Headers ---
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
};

// --- Handler ---
export const handler: Handler = async (event) => {
    // Handle Preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    // Method Check - only GET allowed
    if (event.httpMethod !== 'GET') {
        const errorResponse: ProviderRegistryErrorResponse = {
            error: 'Method Not Allowed',
            code: 'METHOD_NOT_ALLOWED'
        };
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify(errorResponse)
        };
    }

    try {
        // Return the static registry
        // In the future, this could also fetch dynamic metadata from Supabase
        // (e.g., admin-adjusted priceHints, latencyHints, tags)
        const response: ProviderRegistryResponse = {
            providers: PROVIDER_REGISTRY
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            },
            body: JSON.stringify(response)
        };
    } catch (err: any) {
        console.error('[Provider Registry Error]', err);

        const errorResponse: ProviderRegistryErrorResponse = {
            error: 'Internal Server Error',
            code: 'INTERNAL_ERROR'
        };

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify(errorResponse)
        };
    }
};
