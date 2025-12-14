import { useState, useEffect, useCallback } from 'react';
import type { ArtifactVersion, ArtifactStatus } from '../types/architect';
import { versionManager, type CreateVersionParams, type VersionComparison } from '../lib/artifacts/version-manager';

export function useArtifactVersions(artifactId: string) {
    const [versions, setVersions] = useState<ArtifactVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVersions = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await versionManager.getVersions(artifactId);
            setVersions(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch artifact versions:', err);
            setError('Failed to load version history');
        } finally {
            setIsLoading(false);
        }
    }, [artifactId]);

    useEffect(() => {
        if (artifactId) {
            fetchVersions();
        }
    }, [artifactId, fetchVersions]);

    const createVersion = async (params: Omit<CreateVersionParams, 'artifactId'>) => {
        const newVersion = await versionManager.createVersion({
            ...params,
            artifactId,
        });

        if (newVersion) {
            await fetchVersions(); // Refresh list
            return newVersion;
        }
        return null;
    };

    const updateStatus = async (status: ArtifactStatus, userId?: string) => {
        const success = await versionManager.updateStatus(artifactId, status, userId);
        return success;
    };

    const restoreVersion = async (versionId: string) => {
        const success = await versionManager.restoreVersion(artifactId, versionId);
        if (success) {
            await fetchVersions();
        }
        return success;
    };

    const compareVersions = async (versionIdA: string, versionIdB: string): Promise<VersionComparison | null> => {
        return versionManager.compareVersions(versionIdA, versionIdB);
    };

    return {
        versions,
        isLoading,
        error,
        refresh: fetchVersions,
        createVersion,
        updateStatus,
        restoreVersion,
        compareVersions,
    };
}
