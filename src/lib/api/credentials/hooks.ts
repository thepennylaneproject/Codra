/**
 * React Hooks for Credentials - ADAPTED FOR EXISTING SCHEMA
 * Updated to work with your actual table structure
 */

import { useState, useCallback, useEffect } from 'react';
import { credentialsAdapter } from './adapter';
import type {
  ApiCredential,
  CreateCredentialRequest,
  CreateCredentialResponse,
  CredentialTestResult,
  QuotaStats,
  RotateCredentialResult,
  CredentialFilter
} from './types';

/**
 * Hook for managing credentials CRUD operations
 */
export function useCredentials() {
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async (filter?: CredentialFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await credentialsAdapter.getCredentials(filter);
      setCredentials(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch credentials';
      setError(message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCredential = useCallback(
    async (request: CreateCredentialRequest): Promise<CreateCredentialResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await credentialsAdapter.createCredential(request);
        await fetchCredentials();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create credential';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchCredentials]
  );

  const deleteCredential = useCallback(
    async (credentialId: string) => {
      setError(null);
      try {
        await credentialsAdapter.deleteCredential(credentialId);
        setCredentials(creds => creds.filter(c => c.id !== credentialId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete credential';
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateCredential = useCallback(
    async (credentialId: string, updates: Partial<ApiCredential>) => {
      setError(null);
      try {
        const updated = await credentialsAdapter.updateCredential(credentialId, updates);
        setCredentials(creds =>
          creds.map(c => (c.id === credentialId ? updated : c))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update credential';
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    credentials,
    loading,
    error,
    fetchCredentials,
    createCredential,
    deleteCredential,
    updateCredential
  };
}

/**
 * Hook for testing credentials
 */
export function useCredentialTest() {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, CredentialTestResult>>({});
  const [testError, setTestError] = useState<string | null>(null);

  const testCredential = useCallback(async (credentialId: string) => {
    setTesting(credentialId);
    setTestError(null);
    try {
      const result = await credentialsAdapter.testCredential(credentialId);
      setTestResults(prev => ({
        ...prev,
        [credentialId]: result
      }));
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test failed';
      setTestError(message);
      throw err;
    } finally {
      setTesting(null);
    }
  }, []);

  return {
    testing,
    testResults,
    testError,
    testCredential
  };
}

/**
 * Hook for rotating credentials
 */
export function useCredentialRotation() {
  const [rotating, setRotating] = useState<string | null>(null);
  const [rotationError, setRotationError] = useState<string | null>(null);

  const rotateCredential = useCallback(
    async (credentialId: string, newApiKey: string): Promise<RotateCredentialResult | null> => {
      setRotating(credentialId);
      setRotationError(null);
      try {
        const result = await credentialsAdapter.rotateCredential(credentialId, newApiKey);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Rotation failed';
        setRotationError(message);
        throw err;
      } finally {
        setRotating(null);
      }
    },
    []
  );

  return {
    rotating,
    rotationError,
    rotateCredential
  };
}

/**
 * Hook for tracking usage and quotas
 */
export function useCredentialUsage(credentialId?: string) {
  const [usage, setUsage] = useState<QuotaStats | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  const fetchUsage = useCallback(async (id: string) => {
    setUsageLoading(true);
    setUsageError(null);
    try {
      const data = await credentialsAdapter.getUsage(id);
      setUsage(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch usage';
      setUsageError(message);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (credentialId) {
      fetchUsage(credentialId);
    }
  }, [credentialId, fetchUsage]);

  const checkQuotaAlerts = useCallback(async (id: string) => {
    try {
      const data = await credentialsAdapter.checkQuotaAlerts(id);
      setUsage(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check alerts';
      setUsageError(message);
      throw err;
    }
  }, []);

  const recordUsage = useCallback(
    async (id: string, usageData: { requestCount: number; tokenCount: number; cost: number }) => {
      try {
        await credentialsAdapter.recordUsage(id, usageData);
      } catch (err) {
        console.error('Failed to record usage:', err);
      }
    },
    []
  );

  return {
    usage,
    usageLoading,
    usageError,
    fetchUsage,
    checkQuotaAlerts,
    recordUsage
  };
}