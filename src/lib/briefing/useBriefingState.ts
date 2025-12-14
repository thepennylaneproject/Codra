/**
 * useBriefingState Hook
 * React hook for managing mid-project onboarding state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
    briefingStore,
    BriefingState,
    type ProjectPhase,
    type ProjectStats
} from './briefing-store';
import {
    deriveProjectPhase,
    getProjectStats,
    computeProjectStateHash,
    getNextActions,
    isNonTechnicalUser,
    type NextAction,
} from './briefing-utils';
import { useProjectStore } from '../store/project-store';
import type { ProjectSpec } from '../../types/architect';

interface UseBriefingStateOptions {
    projectId: string;
    project?: ProjectSpec | null;
}

interface BriefingHookReturn {
    // State
    briefingState: BriefingState | null;
    isLoading: boolean;
    error: Error | null;

    // Computed values
    shouldShowSnapshot: boolean;
    shouldShowTour: boolean;
    shouldShowUpdateBanner: boolean;
    projectPhase: ProjectPhase;
    projectStats: ProjectStats;
    nextActions: NextAction[];
    isNonTechnical: boolean;

    // Actions
    dismissSnapshot: () => Promise<void>;
    startTour: () => void;
    completeTour: () => Promise<void>;
    skipTour: () => void;
    dismissUpdateBanner: () => Promise<void>;
    recordStudioVisit: () => Promise<void>;
    recordFlowEdit: () => Promise<void>;
    refreshState: () => Promise<void>;
}

export function useBriefingState({ projectId, project: _project }: UseBriefingStateOptions): BriefingHookReturn {
    const { user } = useAuth();
    const [briefingState, setBriefingState] = useState<BriefingState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [showTour, setShowTour] = useState(false);

    // Get project data from store
    const { tasks, prompts, artifacts, workstreams } = useProjectStore((state) => ({
        tasks: Object.values(state.tasks).filter(t => t.projectId === projectId),
        prompts: Object.values(state.prompts).filter(p => p.projectId === projectId),
        artifacts: Object.values(state.artifacts).filter(a => a.projectId === projectId),
        workstreams: Object.values(state.workstreams).filter(w => w.projectId === projectId),
    }));

    // Compute current state hash
    const currentStateHash = useMemo(() =>
        computeProjectStateHash(tasks, prompts, artifacts, workstreams),
        [tasks, prompts, artifacts, workstreams]
    );

    // Compute derived values
    const projectPhase = useMemo(() =>
        deriveProjectPhase(tasks, workstreams, artifacts),
        [tasks, workstreams, artifacts]
    );

    const projectStats = useMemo(() =>
        getProjectStats(tasks, prompts, artifacts),
        [tasks, prompts, artifacts]
    );

    const nextActions = useMemo(() =>
        getNextActions(tasks, artifacts, prompts),
        [tasks, artifacts, prompts]
    );

    const isNonTechnical = useMemo(() =>
        isNonTechnicalUser(briefingState?.userSignals || {
            hasOpenedStudio: false,
            hasEditedFlows: false,
            interactionCount: 0,
        }),
        [briefingState?.userSignals]
    );

    // Load state on mount
    const refreshState = useCallback(async () => {
        if (!user?.id || !projectId) {
            setIsLoading(false);
            return;
        }

        try {
            const state = await briefingStore.getState(user.id, projectId);
            setBriefingState(state);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load briefing state'));
            console.error('Error loading briefing state:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, projectId]);

    useEffect(() => {
        refreshState();
    }, [refreshState]);

    // Record visit on mount (after initial load)
    useEffect(() => {
        if (!isLoading && user?.id && projectId) {
            briefingStore.recordVisit(user.id, projectId, currentStateHash);
        }
    }, [isLoading, user?.id, projectId, currentStateHash]);

    // Computed flags
    const shouldShowSnapshot = !isLoading && !briefingState?.hasSeenSnapshot &&
        (tasks.length > 0 || prompts.length > 0 || artifacts.length > 0);

    const shouldShowTour = showTour;

    const shouldShowUpdateBanner = Boolean(!isLoading && briefingState?.hasSeenSnapshot && briefingState?.lastProjectStateHash !== currentStateHash && !briefingState?.dismissedUpdateBanner);

    // Actions
    const dismissSnapshot = useCallback(async () => {
        if (!user?.id) return;
        await briefingStore.markSnapshotSeen(user.id, projectId);
        await refreshState();
    }, [user?.id, projectId, refreshState]);

    const startTour = useCallback(() => {
        setShowTour(true);
    }, []);

    const completeTour = useCallback(async () => {
        if (!user?.id) return;
        setShowTour(false);
        await briefingStore.markTourCompleted(user.id, projectId);
        await refreshState();
    }, [user?.id, projectId, refreshState]);

    const skipTour = useCallback(() => {
        setShowTour(false);
    }, []);

    const dismissUpdateBanner = useCallback(async () => {
        if (!user?.id) return;
        await briefingStore.dismissUpdateBanner(user.id, projectId, currentStateHash);
        await refreshState();
    }, [user?.id, projectId, currentStateHash, refreshState]);

    const recordStudioVisit = useCallback(async () => {
        if (!user?.id) return;
        await briefingStore.updateUserSignals(user.id, projectId, { hasOpenedStudio: true });
    }, [user?.id, projectId]);

    const recordFlowEdit = useCallback(async () => {
        if (!user?.id) return;
        await briefingStore.updateUserSignals(user.id, projectId, { hasEditedFlows: true });
    }, [user?.id, projectId]);

    return {
        briefingState,
        isLoading,
        error,
        shouldShowSnapshot,
        shouldShowTour,
        shouldShowUpdateBanner,
        projectPhase,
        projectStats,
        nextActions,
        isNonTechnical: isNonTechnical ?? false,
        dismissSnapshot,
        startTour,
        completeTour,
        skipTour,
        dismissUpdateBanner,
        recordStudioVisit,
        recordFlowEdit,
        refreshState,
    };
}
