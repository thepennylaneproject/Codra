/**
 * BRIEFING STORE
 * Manages per-user, per-project orientation state for mid-project onboarding
 * Persists to Supabase for cross-device consistency
 */

import { supabase } from '../supabase';

// ============================================================================
// Types
// ============================================================================

export interface UserSignals {
    hasOpenedStudio: boolean;
    hasEditedFlows: boolean;
    interactionCount: number;
}

export interface BriefingState {
    id: string;
    userId: string;
    projectId: string;
    hasSeenSnapshot: boolean;
    hasCompletedTour: boolean;
    dismissedUpdateBanner: boolean;
    lastVisitedAt: string | null;
    lastProjectStateHash: string | null;
    userSignals: UserSignals;
    createdAt: string;
    updatedAt: string;
}

export type ProjectPhase = 'planning' | 'building' | 'testing' | 'shipping';

export interface ProjectStats {
    flowCount: number;
    promptCount: number;
    taskCount: number;
    completedTaskCount: number;
    assetCount: number;
}

export interface ChangeReport {
    hasSignificantChanges: boolean;
    changes: Array<{
        type: 'flows_added' | 'tasks_added' | 'prompts_added' | 'structure_changed';
        count: number;
        description: string;
    }>;
}

// Default state for new users on a project
const DEFAULT_SIGNALS: UserSignals = {
    hasOpenedStudio: false,
    hasEditedFlows: false,
    interactionCount: 0,
};

// ============================================================================
// Store Operations
// ============================================================================

export const briefingStore = {
    /**
     * Get briefing state for a user on a specific project
     */
    async getState(userId: string, projectId: string): Promise<BriefingState | null> {
        const { data, error } = await supabase
            .from('project_briefing_state')
            .select('*')
            .eq('user_id', userId)
            .eq('project_id', projectId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No record found - this is expected for first visits
                return null;
            }
            console.error('Error fetching briefing state:', error);
            return null;
        }

        return this.mapFromDb(data);
    },

    /**
     * Create or update briefing state
     */
    async upsertState(
        userId: string,
        projectId: string,
        updates: Partial<Omit<BriefingState, 'id' | 'userId' | 'projectId' | 'createdAt' | 'updatedAt'>>
    ): Promise<BriefingState | null> {
        const { data, error } = await supabase
            .from('project_briefing_state')
            .upsert(
                {
                    user_id: userId,
                    project_id: projectId,
                    has_seen_snapshot: updates.hasSeenSnapshot,
                    has_completed_tour: updates.hasCompletedTour,
                    dismissed_update_banner: updates.dismissedUpdateBanner,
                    last_visited_at: updates.lastVisitedAt,
                    last_project_state_hash: updates.lastProjectStateHash,
                    user_signals: updates.userSignals,
                },
                {
                    onConflict: 'user_id,project_id',
                }
            )
            .select()
            .single();

        if (error) {
            console.error('Error upserting briefing state:', error);
            return null;
        }

        return this.mapFromDb(data);
    },

    /**
     * Mark snapshot as seen
     */
    async markSnapshotSeen(userId: string, projectId: string): Promise<boolean> {
        const result = await this.upsertState(userId, projectId, {
            hasSeenSnapshot: true,
            lastVisitedAt: new Date().toISOString(),
        });
        return result !== null;
    },

    /**
     * Mark tour as completed
     */
    async markTourCompleted(userId: string, projectId: string): Promise<boolean> {
        const result = await this.upsertState(userId, projectId, {
            hasCompletedTour: true,
        });
        return result !== null;
    },

    /**
     * Dismiss update banner
     */
    async dismissUpdateBanner(userId: string, projectId: string, newStateHash: string): Promise<boolean> {
        const result = await this.upsertState(userId, projectId, {
            dismissedUpdateBanner: true,
            lastProjectStateHash: newStateHash,
        });
        return result !== null;
    },

    /**
     * Update user signals (for adaptive language)
     */
    async updateUserSignals(
        userId: string,
        projectId: string,
        signalUpdates: Partial<UserSignals>
    ): Promise<boolean> {
        const current = await this.getState(userId, projectId);
        const updatedSignals: UserSignals = {
            ...DEFAULT_SIGNALS,
            ...(current?.userSignals || {}),
            ...signalUpdates,
        };

        const result = await this.upsertState(userId, projectId, {
            userSignals: updatedSignals,
        });
        return result !== null;
    },

    /**
     * Record a visit and update state hash
     */
    async recordVisit(userId: string, projectId: string, stateHash: string): Promise<boolean> {
        const current = await this.getState(userId, projectId);

        const result = await this.upsertState(userId, projectId, {
            lastVisitedAt: new Date().toISOString(),
            lastProjectStateHash: stateHash,
            // Reset banner dismissal if state changed
            dismissedUpdateBanner: current?.lastProjectStateHash === stateHash
                ? current.dismissedUpdateBanner
                : false,
            userSignals: {
                ...DEFAULT_SIGNALS,
                ...(current?.userSignals || {}),
                interactionCount: (current?.userSignals.interactionCount || 0) + 1,
            },
        });
        return result !== null;
    },

    /**
     * Check if user should see orientation (trigger conditions)
     */
    async shouldShowOrientation(
        userId: string,
        projectId: string,
        _projectCreatorId: string
    ): Promise<boolean> {
        const state = await this.getState(userId, projectId);

        // Never seen snapshot = show orientation
        if (!state || !state.hasSeenSnapshot) {
            return true;
        }

        return false;
    },

    /**
     * Check if user should see update banner
     */
    async shouldShowUpdateBanner(
        userId: string,
        projectId: string,
        currentStateHash: string
    ): Promise<boolean> {
        const state = await this.getState(userId, projectId);

        // First visit or no previous hash
        if (!state || !state.lastProjectStateHash) {
            return false;
        }

        // Already dismissed for this state
        if (state.dismissedUpdateBanner && state.lastProjectStateHash === currentStateHash) {
            return false;
        }

        // State changed since last visit
        return state.lastProjectStateHash !== currentStateHash;
    },

    /**
     * Map database record to TypeScript interface
     */
    mapFromDb(record: Record<string, unknown>): BriefingState {
        return {
            id: record.id as string,
            userId: record.user_id as string,
            projectId: record.project_id as string,
            hasSeenSnapshot: record.has_seen_snapshot as boolean,
            hasCompletedTour: record.has_completed_tour as boolean,
            dismissedUpdateBanner: record.dismissed_update_banner as boolean,
            lastVisitedAt: record.last_visited_at as string | null,
            lastProjectStateHash: record.last_project_state_hash as string | null,
            userSignals: (record.user_signals as UserSignals) || DEFAULT_SIGNALS,
            createdAt: record.created_at as string,
            updatedAt: record.updated_at as string,
        };
    },
};
