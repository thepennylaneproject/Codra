import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    parseJobResponse,
    ingestJobBatch,
} from '../jobIngestion';
import type { JobApiResponse, RawJobResult } from '../jobIngestion';

const mockRaw: RawJobResult = {
    id: 'job-1',
    title: 'Software Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    description: 'Build cool things',
    url: 'https://example.com/job/1',
    posted_at: '2024-01-15',
};

describe('parseJobResponse', () => {
    describe('null / undefined results (API v2.3 edge cases)', () => {
        it('returns an empty array when results is null', () => {
            const response: JobApiResponse = { results: null };
            const parsed = parseJobResponse(response);
            expect(parsed).toEqual([]);
        });

        it('returns an empty array when results is undefined', () => {
            const response: JobApiResponse = { results: undefined };
            const parsed = parseJobResponse(response);
            expect(parsed).toEqual([]);
        });

        it('logs a warning when results is null', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            parseJobResponse({ results: null });
            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('[jobIngestion]'),
            );
            warn.mockRestore();
        });

        it('logs a warning when results is undefined', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            parseJobResponse({ results: undefined });
            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('[jobIngestion]'),
            );
            warn.mockRestore();
        });
    });

    describe('empty results array', () => {
        it('returns an empty array when results is []', () => {
            const response: JobApiResponse = { results: [] };
            const parsed = parseJobResponse(response);
            expect(parsed).toEqual([]);
        });

        it('does not log a warning for an empty array', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            parseJobResponse({ results: [] });
            expect(warn).not.toHaveBeenCalled();
            warn.mockRestore();
        });
    });

    describe('valid results', () => {
        it('maps raw API results to ParsedJob objects', () => {
            const response: JobApiResponse = { results: [mockRaw] };
            const [job] = parseJobResponse(response);

            expect(job).toEqual({
                id: 'job-1',
                title: 'Software Engineer',
                company: 'Acme Corp',
                location: 'Remote',
                description: 'Build cool things',
                url: 'https://example.com/job/1',
                postedAt: '2024-01-15',
            });
        });

        it('defaults missing optional fields to empty string or null', () => {
            const minimal: RawJobResult = {
                id: 'job-2',
                title: 'Designer',
                company: 'Studio',
                location: 'NYC',
            };
            const [job] = parseJobResponse({ results: [minimal] });

            expect(job.description).toBe('');
            expect(job.url).toBe('');
            expect(job.postedAt).toBeNull();
        });

        it('returns one ParsedJob per raw result', () => {
            const response: JobApiResponse = {
                results: [mockRaw, { ...mockRaw, id: 'job-3' }],
            };
            expect(parseJobResponse(response)).toHaveLength(2);
        });
    });
});

describe('ingestJobBatch (integration)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns parsed jobs from a successful fetch', async () => {
        const fetchFn = vi.fn().mockResolvedValue({ results: [mockRaw] });
        const result = await ingestJobBatch(fetchFn, 'batch-1');

        expect(result.batchId).toBe('batch-1');
        expect(result.count).toBe(1);
        expect(result.jobs[0].id).toBe('job-1');
    });

    it('completes without error when the API returns null results', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const fetchFn = vi.fn<() => Promise<JobApiResponse>>().mockResolvedValue({ results: null });
        const result = await ingestJobBatch(fetchFn, 'batch-null');

        expect(result.count).toBe(0);
        expect(result.jobs).toEqual([]);
    });

    it('returns an empty batch and logs when the fetch throws', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
        const result = await ingestJobBatch(fetchFn, 'batch-err');

        expect(result.count).toBe(0);
        expect(result.jobs).toEqual([]);
        expect(error).toHaveBeenCalledWith(
            expect.stringContaining('batch-err'),
            expect.any(Error),
        );
    });
});
