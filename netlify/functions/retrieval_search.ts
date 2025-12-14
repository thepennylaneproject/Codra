import { Handler } from '@netlify/functions';
import {
    RetrievalRequest,
    RetrievalResponse,
    RetrievalErrorResponse,
    RetrievalProvider
} from '../../src/lib/ai/types-retrieval';
import {
    selectProviderAuto,
    searchBrave,
    searchTavily
} from './utils/retrieval-providers';
import { logRetrievalRun } from './utils/telemetry-helpers';

// --- Rate Limiting (Simple In-Memory) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_IP = 20;

interface RateLimitData {
    count: number;
    resetAt: number;
}

// Note: In serverless, memory is not guaranteed to persist, 
// but often does for warm containers. This is acceptable for simple guardrails.
const rateLimitMap = new Map<string, RateLimitData>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    let data = rateLimitMap.get(ip);

    if (!data || now > data.resetAt) {
        data = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
        rateLimitMap.set(ip, data);
    }

    if (data.count >= MAX_REQUESTS_PER_IP) {
        return false;
    }

    data.count++;
    return true;
}

// --- CORS Headers ---
const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Client-IP, X-Forwarded-For',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- Handler ---

export const handler: Handler = async (event, context) => {
    // 0. Handle Preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    // 1. Method Check
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: 'Method Not Allowed'
        };
    }

    // 2. Rate Limit
    const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return {
            statusCode: 429,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Too many requests' }),
        };
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        // 3. Parse & Validate Input
        if (!event.body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing body', requestId })
            };
        }

        let body: Partial<RetrievalRequest>;
        try {
            body = JSON.parse(event.body);
        } catch {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Invalid JSON', requestId })
            };
        }

        const {
            query,
            provider = 'auto',
            recencyDays,
            includeSnippets = true,
            workspaceId // Optional workspace context for telemetry
        } = body;

        // Hard cap validation
        let { maxResults = 5 } = body;
        if (maxResults > 10) maxResults = 10;
        if (maxResults < 1) maxResults = 1;

        if (!query || typeof query !== 'string') {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Query is required', requestId })
            };
        }

        // 4. Provider Selection
        let selectedProvider: 'brave' | 'tavily' = 'brave'; // Default
        if (provider === 'auto') {
            selectedProvider = selectProviderAuto(query);
        } else if (provider === 'brave' || provider === 'tavily') {
            selectedProvider = provider;
        } else {
            // fallback if invalid provider string sent
            selectedProvider = 'brave';
        }

        // 5. Execution
        let results = [];

        if (selectedProvider === 'brave') {
            const braveKey = process.env.BRAVE_SEARCH_API_KEY;
            if (!braveKey) {
                throw new Error('Server configuration error: Brave API key missing');
            }
            results = await searchBrave(query, braveKey, maxResults);
        } else {
            const tavilyKey = process.env.TAVILY_API_KEY;
            if (!tavilyKey) {
                throw new Error('Server configuration error: Tavily API key missing');
            }
            results = await searchTavily(query, tavilyKey, maxResults, includeSnippets, recencyDays);
        }

        const latencyMs = Date.now() - startTime;

        // 6. Log telemetry (fire and forget - don't block response)
        logRetrievalRun({
            userId: null, // TODO: Extract from auth header if available
            workspaceId: workspaceId || null,
            providerUsed: selectedProvider,
            query,
            resultsCount: results.length,
            latencyMs,
            success: true,
        }).catch(err => {
            console.error('[Telemetry] Failed to log retrieval run:', err);
        });

        const response: RetrievalResponse = {
            providerUsed: selectedProvider,
            requestId,
            latencyMs,
            results
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
        console.error(`[Retrieval Error] RequestId: ${requestId}`, err);

        const latencyMs = Date.now() - startTime;

        // Log failed retrieval run
        logRetrievalRun({
            userId: null, // TODO: Extract from auth header if available
            workspaceId: null, // Not available in error context
            providerUsed: 'brave', // Default assumption
            query: '', // Not available in error context
            resultsCount: 0,
            latencyMs,
            success: false,
            errorMessageSafe: err.message.includes('API key missing')
                ? 'Internal Server Error'
                : 'Upstream Provider Error',
        }).catch(telemetryErr => {
            console.error('[Telemetry] Failed to log failed retrieval run:', telemetryErr);
        });

        // Safe error message for client
        const isConfigError = err.message.includes('API key missing');
        const statusCode = isConfigError ? 500 : 502;
        const message = isConfigError ? 'Internal Server Error' : 'Upstream Provider Error';

        const errorResponse: RetrievalErrorResponse = {
            error: message, // Do not leak exception details
            requestId
        };

        return {
            statusCode,
            headers: corsHeaders,
            body: JSON.stringify(errorResponse)
        };
    }
};
