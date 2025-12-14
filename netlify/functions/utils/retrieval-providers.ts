import { RetrievalResultItem } from '../../../src/lib/ai/types-retrieval';

// --- Types for Internal Use ---

interface BraveSearchResponse {
    web?: {
        results?: Array<{
            title: string;
            url: string;
            description?: string;
            age?: string; // Brave often returns "2 hours ago" or dates
            page_age?: string;
        }>;
    };
}

interface TavilySearchResponse {
    results: Array<{
        title: string;
        url: string;
        content: string;
        published_date?: string;
    }>;
}

// --- Helpers ---

// Auto-detection logic
export function selectProviderAuto(query: string): 'brave' | 'tavily' {
    const newsKeywords = ['latest', 'today', 'current', 'breaking', 'news', 'update', 'yesterday'];
    const lowerQuery = query.toLowerCase();

    // If query implies need for very recent news, prefer Tavily (often better for news/context)
    // Otherwise default to Brave for general web search
    const isNews = newsKeywords.some(kw => lowerQuery.includes(kw));
    return isNews ? 'tavily' : 'brave';
}

// --- Provider Implementations ---

export async function searchBrave(
    query: string,
    apiKey: string,
    maxResults: number = 5
): Promise<RetrievalResultItem[]> {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.append('q', query);
    url.searchParams.append('count', Math.min(maxResults, 10).toString()); // Hard cap 10 enforced here too

    const response = await fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey
        }
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('Brave rate limit exceeded');
        }
        throw new Error(`Brave API error: ${response.status}`);
    }

    const data = (await response.json()) as BraveSearchResponse;

    return (data.web?.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        // Brave dates can be relative strings; passing through or leaving undefined if raw
        publishedAt: r.page_age || undefined,
        source: 'brave'
    }));
}

export async function searchTavily(
    query: string,
    apiKey: string,
    maxResults: number = 5,
    includeSnippets: boolean = true,
    _recencyDays?: number // Reserved for future use
): Promise<RetrievalResultItem[]> {
    const body = {
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: Math.min(maxResults, 10),
        include_domains: [],
        exclude_domains: [],
        include_text: includeSnippets,
    };

    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('Tavily rate limit exceeded');
        }
        throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = (await response.json()) as TavilySearchResponse;

    return (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        publishedAt: r.published_date,
        source: 'tavily'
    }));
}
