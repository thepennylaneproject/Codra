export type RetrievalProvider = 'brave' | 'tavily' | 'auto';

export interface RetrievalRequest {
    query: string;
    provider: RetrievalProvider;
    maxResults?: number;
    recencyDays?: number;
    includeSnippets?: boolean;
    workspaceId?: string; // Optional workspace context for telemetry
}

export interface RetrievalResultItem {
    title: string;
    url: string;
    snippet?: string;
    publishedAt?: string;
    source: 'brave' | 'tavily';
}

export interface RetrievalResponse {
    providerUsed: 'brave' | 'tavily';
    requestId: string;
    latencyMs: number;
    results: RetrievalResultItem[];
}

export interface RetrievalErrorResponse {
    error: string;
    requestId: string;
}
