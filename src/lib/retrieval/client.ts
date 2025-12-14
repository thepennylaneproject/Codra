/**
 * RETRIEVAL CLIENT SDK
 * src/lib/retrieval/client.ts
 * 
 * Client-side SDK for invoking the retrieval_search Netlify function.
 * Provides typed request/response for grounded prompt generation.
 */

import {
    RetrievalRequest,
    RetrievalResponse,
    RetrievalResultItem,
    RetrievalProvider,
    RetrievalErrorResponse,
} from '../ai/types-retrieval';

// ============================================================
// Types
// ============================================================

export interface RetrievalSearchInput {
    /** The search query */
    query: string;
    /** Provider preference: 'auto', 'brave', or 'tavily' */
    provider?: RetrievalProvider;
    /** Maximum number of results (3-10, default 5) */
    maxResults?: number;
    /** Include snippets in results (default true) */
    includeSnippets?: boolean;
    /** Recency filter in days (optional) */
    recencyDays?: number;
    /** Optional workspace ID for telemetry tracking */
    workspaceId?: string;
}

export interface RetrievalSearchResponse {
    /** Whether the search was successful */
    success: boolean;
    /** The provider that was used */
    providerUsed?: 'brave' | 'tavily';
    /** Request ID for debugging */
    requestId?: string;
    /** Latency in milliseconds */
    latencyMs?: number;
    /** Retrieved results */
    results: RetrievalResultItem[];
    /** Error message if failed */
    error?: string;
}

// ============================================================
// Client Function
// ============================================================

/**
 * Search for sources using the retrieval API.
 * Calls the /.netlify/functions/retrieval_search endpoint.
 * 
 * @param input - Search parameters
 * @returns Normalized search results with metadata
 */
export async function retrievalSearch(
    input: RetrievalSearchInput
): Promise<RetrievalSearchResponse> {
    const { query, provider = 'auto', maxResults = 5, includeSnippets = true, recencyDays, workspaceId } = input;

    // Validate and clamp maxResults
    const clampedMaxResults = Math.min(Math.max(maxResults, 3), 8);

    try {
        const response = await fetch('/.netlify/functions/retrieval_search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                provider,
                maxResults: clampedMaxResults,
                includeSnippets,
                recencyDays,
                workspaceId, // Pass to server for telemetry
            } satisfies RetrievalRequest),
        });

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json() as RetrievalErrorResponse;
            return {
                success: false,
                results: [],
                error: errorData.error || `Request failed with status ${response.status}`,
                requestId: errorData.requestId,
            };
        }

        const data = await response.json() as RetrievalResponse;

        return {
            success: true,
            providerUsed: data.providerUsed,
            requestId: data.requestId,
            latencyMs: data.latencyMs,
            results: data.results,
        };
    } catch (error) {
        // Handle network errors
        const message = error instanceof Error ? error.message : 'Network error';
        return {
            success: false,
            results: [],
            error: message,
        };
    }
}

// ============================================================
// Formatting Utilities
// ============================================================

/**
 * Format retrieved sources into a SOURCES block for prompt injection.
 * 
 * @param results - Retrieved source items
 * @returns Formatted SOURCES block string
 */
export function formatSourcesBlock(results: RetrievalResultItem[]): string {
    if (results.length === 0) return '';

    const lines = results.map((item, index) => {
        const num = index + 1;
        const snippetLine = item.snippet ? `    ${item.snippet}` : '';
        return `[${num}] ${item.title} - ${item.url}${snippetLine ? '\n' + snippetLine : ''}`;
    });

    return `SOURCES:\n${lines.join('\n')}`;
}

/**
 * Generate grounding instructions for the AI model.
 * 
 * @returns Instructions string to prepend to system prompt
 */
export function getGroundingInstructions(): string {
    return [
        'GROUNDING INSTRUCTIONS:',
        '- Use ONLY the provided SOURCES to answer the query.',
        '- Cite sources by number (e.g., [1], [2]) when using information from them.',
        '- If the sources do not contain sufficient information to answer, explicitly state: "I cannot verify this based on the provided sources."',
        '- Do not fabricate information not present in the sources.',
        '',
    ].join('\n');
}

// ============================================================
// Re-exports for convenience
// ============================================================

export type { RetrievalResultItem, RetrievalProvider } from '../ai/types-retrieval';
