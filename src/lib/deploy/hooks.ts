import { useState, useCallback } from 'react';
import { netlifyAdapter } from './netlify';
import { vercelAdapter } from './vercel';

type Provider = 'netlify' | 'vercel';

interface UseDeployOptions {
    provider: Provider;
    token: string;
}

export function useDeploy({ provider, token }: UseDeployOptions) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const adapter = provider === 'netlify' ? netlifyAdapter : vercelAdapter;

    const listSites = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            return await adapter.listSites(token);
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [adapter, token]);

    const getSite = useCallback(async (siteId: string) => {
        setLoading(true);
        try {
            return await adapter.getSite(token, siteId);
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [adapter, token]);

    const listDeploys = useCallback(async (siteId: string) => {
        setLoading(true);
        try {
            return await adapter.listDeploys(token, siteId);
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [adapter, token]);

    const triggerDeploy = useCallback(async (siteId: string, clearCache?: boolean) => {
        setLoading(true);
        try {
            return await adapter.triggerDeploy(token, siteId, clearCache);
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [adapter, token]);

    const getEnvVars = useCallback(async (siteId: string) => {
        try {
            return await adapter.getEnvVars(token, siteId);
        } catch (err: any) {
            setError(err.message);
            return [];
        }
    }, [adapter, token]);

    const updateEnvVar = useCallback(async (siteId: string, key: string, value: string) => {
        try {
            await adapter.setEnvVar(token, siteId, key, value);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    }, [adapter, token]);

    return {
        loading,
        error,
        listSites,
        getSite,
        listDeploys,
        triggerDeploy,
        getEnvVars,
        updateEnvVar
    };
}
