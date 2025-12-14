/**
 * Provider Registry React Hook
 * 
 * React hook for fetching and using the provider registry.
 * Provides loading states, error handling, and auto-caching.
 * 
 * @example
 * import { useProviderRegistry } from '@/lib/ai/registry/useProviderRegistry';
 * 
 * function ModelSelector() {
 *   const { providers, isLoading, error, refetch } = useProviderRegistry();
 * 
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 * 
 *   return (
 *     <select>
 *       {providers.map(p => (
 *         <optgroup key={p.id} label={p.displayName}>
 *           {p.models.map(m => (
 *             <option key={m.id} value={m.id}>{m.displayName}</option>
 *           ))}
 *         </optgroup>
 *       ))}
 *     </select>
 *   );
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import { ProviderRegistryEntry } from './types';
import { fetchProviderRegistry } from './client';

export interface UseProviderRegistryResult {
    /** List of all providers with their models */
    providers: ProviderRegistryEntry[];
    /** True while initial fetch is in progress */
    isLoading: boolean;
    /** Error if fetch failed */
    error: Error | null;
    /** Force a fresh fetch, bypassing cache */
    refetch: () => Promise<void>;
}

/**
 * React hook for provider registry data
 * 
 * Features:
 * - Automatic initial fetch on mount
 * - In-memory caching (5 minutes)
 * - Graceful error handling with stale cache fallback
 * - Manual refetch capability
 */
export function useProviderRegistry(): UseProviderRegistryResult {
    const [providers, setProviders] = useState<ProviderRegistryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchProviderRegistry(true);
            setProviders(data.providers);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        fetchProviderRegistry()
            .then(data => {
                if (!cancelled) {
                    setProviders(data.providers);
                    setIsLoading(false);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { providers, isLoading, error, refetch };
}

export default useProviderRegistry;
