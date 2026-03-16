/**
 * Job Ingestion Service
 *
 * Handles fetching and parsing job listings from the external job API (v2.3+).
 * The API may return {results: null} when no jobs match the query; this behaviour
 * is documented in the API changelog from v2.3 and must be handled gracefully.
 */

export interface RawJobResult {
    id: string;
    title: string;
    company: string;
    location: string;
    description?: string;
    url?: string;
    posted_at?: string;
}

export interface ParsedJob {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    postedAt: string | null;
}

export interface JobApiResponse {
    results: RawJobResult[] | null | undefined;
    total?: number;
    page?: number;
}

export interface IngestionBatchResult {
    jobs: ParsedJob[];
    count: number;
    batchId: string;
}

/**
 * Parse the API response from the external job service.
 * The API may return {results: null} per v2.3 changelog when no results match.
 * We guard against this with null coalescing and log a warning for observability.
 */
export function parseJobResponse(response: JobApiResponse): ParsedJob[] {
    const { results } = response;

    if (results === null || results === undefined) {
        console.warn('[jobIngestion] API returned null/undefined results – treating as empty batch');
    }

    return (results ?? []).map((raw) => ({
        id: raw.id,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        description: raw.description ?? '',
        url: raw.url ?? '',
        postedAt: raw.posted_at ?? null,
    }));
}

/**
 * Run a full ingestion batch: fetch, parse, and return results.
 * Errors are logged but do not propagate so that one failed batch does not
 * abort the entire pipeline run.
 */
export async function ingestJobBatch(
    fetchFn: () => Promise<JobApiResponse>,
    batchId: string,
): Promise<IngestionBatchResult> {
    try {
        const response = await fetchFn();
        const jobs = parseJobResponse(response);
        return { jobs, count: jobs.length, batchId };
    } catch (error) {
        console.error(`[jobIngestion] Batch ${batchId} failed:`, error);
        return { jobs: [], count: 0, batchId };
    }
}
