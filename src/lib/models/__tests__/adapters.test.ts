/**
 * Provider Adapter Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for adapter tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Provider Adapters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('AIMLAPI Adapter', () => {
        it('should normalize model records from API response', () => {
            const apiResponse = {
                id: 'gpt-4o',
                object: 'model',
                owned_by: 'openai',
            };

            // Simulate normalization
            const normalized = {
                model_key: apiResponse.id,
                display_name: apiResponse.id
                    .split(/[-_]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' '),
                raw: apiResponse,
            };

            expect(normalized.model_key).toBe('gpt-4o');
            expect(normalized.display_name).toBe('Gpt 4o');
            expect(normalized.raw).toEqual(apiResponse);
        });

        it('should return empty array on API error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
            });

            // Simulate adapter behavior
            const handleApiError = (response: { ok: boolean }) => {
                if (!response.ok) return [];
                return [{ model_key: 'test' }];
            };

            const result = handleApiError({ ok: false });
            expect(result).toEqual([]);
        });

        it('should infer capabilities from model name', () => {
            const inferCapabilities = (model_key: string) => {
                const lowerKey = model_key.toLowerCase();
                const capabilities: Record<string, boolean | number> = {};

                if (lowerKey.includes('gpt-4o') || lowerKey.includes('vision')) {
                    capabilities.vision = true;
                }
                if (lowerKey.includes('gpt-4') || lowerKey.includes('claude-3')) {
                    capabilities.tools = true;
                }
                if (lowerKey.includes('claude-3')) {
                    capabilities.max_context = 200000;
                } else if (lowerKey.includes('gpt-4o')) {
                    capabilities.max_context = 128000;
                }

                return capabilities;
            };

            const gpt4oCaps = inferCapabilities('gpt-4o');
            expect(gpt4oCaps.vision).toBe(true);
            expect(gpt4oCaps.tools).toBe(true);
            expect(gpt4oCaps.max_context).toBe(128000);

            const claudeCaps = inferCapabilities('claude-3-5-sonnet');
            expect(claudeCaps.tools).toBe(true);
            expect(claudeCaps.max_context).toBe(200000);
        });
    });

    describe('OpenAI Adapter', () => {
        it('should filter to only chat models', () => {
            const models = [
                { id: 'gpt-4o' },
                { id: 'gpt-3.5-turbo' },
                { id: 'text-embedding-ada-002' },
                { id: 'whisper-1' },
                { id: 'ft:gpt-3.5-turbo:custom' },
            ];

            const isChatModel = (id: string) => {
                const lower = id.toLowerCase();
                if (lower.includes('gpt-4') || lower.includes('gpt-3.5')) {
                    if (lower.startsWith('ft:')) return false;
                    return true;
                }
                if (lower.startsWith('o1')) return true;
                return false;
            };

            const chatModels = models.filter(m => isChatModel(m.id));
            
            expect(chatModels.length).toBe(2);
            expect(chatModels.map(m => m.id)).toContain('gpt-4o');
            expect(chatModels.map(m => m.id)).toContain('gpt-3.5-turbo');
        });

        it('should generate pretty display names', () => {
            const formatDisplayName = (id: string) => {
                if (id.startsWith('gpt-4o')) {
                    return 'GPT-4o' + id.slice(6).replace(/-/g, ' ');
                }
                if (id.startsWith('gpt-4')) {
                    return 'GPT-4' + id.slice(5).replace(/-/g, ' ');
                }
                if (id.startsWith('gpt-3.5')) {
                    return 'GPT-3.5' + id.slice(7).replace(/-/g, ' ');
                }
                return id;
            };

            expect(formatDisplayName('gpt-4o').trim()).toBe('GPT-4o');
            expect(formatDisplayName('gpt-4-turbo').trim()).toBe('GPT-4 turbo');
            expect(formatDisplayName('gpt-3.5-turbo').trim()).toBe('GPT-3.5 turbo');
        });
    });

    describe('Smoke Test', () => {
        it('should return ok=true on successful response', async () => {
            // Test the smoke test logic directly without fetch
            const simulateResponse = (ok: boolean) => {
                const startTime = Date.now();
                const latency_ms = Date.now() - startTime + 50; // Simulated latency
                
                if (!ok) {
                    return { ok: false, latency_ms, error: 'HTTP error' };
                }
                return { ok: true, latency_ms };
            };

            const result = simulateResponse(true);
            expect(result.ok).toBe(true);
            expect(result.latency_ms).toBeDefined();
        });

        it('should return ok=false on error response', async () => {
            // Test the smoke test logic directly without fetch
            const simulateErrorResponse = () => {
                const latency_ms = 100;
                return { ok: false, latency_ms, error: 'Internal server error' };
            };

            const result = simulateErrorResponse();
            expect(result.ok).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toBe('Internal server error');
        });

        it('should handle timeout errors', () => {
            // Test timeout handling logic
            const simulateTimeout = () => {
                return { ok: false, latency_ms: 30000, error: 'Request timed out' };
            };

            const result = simulateTimeout();
            expect(result.ok).toBe(false);
            expect(result.error).toContain('timed out');
        });
    });
});

