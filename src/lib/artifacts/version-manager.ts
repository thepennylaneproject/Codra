/**
 * VERSION MANAGER
 * Handles artifact version CRUD and comparison
 */

import { supabase } from '../supabase';
import type { ArtifactVersion, ArtifactStatus } from '../../types/architect';
import { calculateDiff } from './diff-utils';

export interface CreateVersionParams {
    artifactId: string;
    content: string;
    createdBy: 'agent' | 'user';
    promptUsed?: string;
    modelUsed?: string;
    userFeedbackTags?: string[];
    userFeedbackNote?: string;
}

export interface VersionComparison {
    versionA: ArtifactVersion;
    versionB: ArtifactVersion;
    diff: {
        type: 'added' | 'removed' | 'unchanged';
        value: string;
    }[];
    summary: {
        additions: number;
        deletions: number;
        changes: number;
    };
}

export const versionManager = {
    /**
     * Create a new version for an artifact
     */
    async createVersion(params: CreateVersionParams): Promise<ArtifactVersion | null> {
        try {
            // Get current version count
            const { data: artifact } = await supabase
                .from('artifacts')
                .select('version_count')
                .eq('id', params.artifactId)
                .single();

            const newVersionNumber = (artifact?.version_count || 0) + 1;

            // Create content hash for deduplication
            const contentHash = await hashContent(params.content);

            // Calculate diff from previous version if exists
            let diffFromPrevious: string | undefined;
            // Note: artifact.version_count is snake_case in DB but might be destructured differently depending on client setup.
            // Assuming straightforward select here.
            if (artifact && artifact.version_count > 0) {
                const { data: previousVersion } = await supabase
                    .from('artifact_versions')
                    .select('content')
                    .eq('artifact_id', params.artifactId)
                    .order('version_number', { ascending: false })
                    .limit(1)
                    .single();

                if (previousVersion) {
                    diffFromPrevious = JSON.stringify(
                        calculateDiff(previousVersion.content, params.content)
                    );
                }
            }

            // Insert new version
            const { data: version, error } = await supabase
                .from('artifact_versions')
                .insert({
                    artifact_id: params.artifactId,
                    version_number: newVersionNumber,
                    content: params.content,
                    content_hash: contentHash,
                    created_by: params.createdBy,
                    prompt_used: params.promptUsed,
                    model_used: params.modelUsed,
                    user_feedback_tags: params.userFeedbackTags || [],
                    user_feedback_note: params.userFeedbackNote,
                    diff_from_previous: diffFromPrevious,
                })
                .select()
                .single();

            if (error) throw error;

            // Update artifact with new version info
            await supabase
                .from('artifacts')
                .update({
                    current_version_id: version.id,
                    version_count: newVersionNumber,
                    status: 'under_review',
                })
                .eq('id', params.artifactId);

            // We need to map DB response to camelCase ArtifactVersion type if Supabase returns snake_case
            // Assuming a mapper exists or standardizing on map-on-fetch. 
            // For this implementation, I will manually map strictly for safety.
            return mapDbVersionToType(version);
        } catch (error) {
            console.error('Error creating version:', error);
            return null;
        }
    },

    /**
     * Get all versions for an artifact
     */
    async getVersions(artifactId: string): Promise<ArtifactVersion[]> {
        const { data, error } = await supabase
            .from('artifact_versions')
            .select('*')
            .eq('artifact_id', artifactId)
            .order('version_number', { ascending: false });

        if (error) {
            console.error('Error fetching versions:', error);
            return [];
        }

        return data.map(mapDbVersionToType);
    },

    /**
     * Get a specific version
     */
    async getVersion(versionId: string): Promise<ArtifactVersion | null> {
        const { data, error } = await supabase
            .from('artifact_versions')
            .select('*')
            .eq('id', versionId)
            .single();

        if (error) return null;
        return mapDbVersionToType(data);
    },

    /**
     * Compare two versions
     */
    async compareVersions(
        versionIdA: string,
        versionIdB: string
    ): Promise<VersionComparison | null> {
        const [versionA, versionB] = await Promise.all([
            this.getVersion(versionIdA),
            this.getVersion(versionIdB),
        ]);

        if (!versionA || !versionB) return null;

        const diff = calculateDiff(versionA.content, versionB.content);
        const summary = {
            additions: diff.filter(d => d.type === 'added').length,
            deletions: diff.filter(d => d.type === 'removed').length,
            changes: diff.filter(d => d.type !== 'unchanged').length,
        };

        return { versionA, versionB, diff, summary };
    },

    /**
     * Restore a previous version as current
     */
    async restoreVersion(artifactId: string, versionId: string): Promise<boolean> {
        try {
            const version = await this.getVersion(versionId);
            if (!version || version.artifactId !== artifactId) return false;

            // Create a new version with the old content
            await this.createVersion({
                artifactId,
                content: version.content,
                createdBy: 'user',
                userFeedbackNote: `Restored from version ${version.versionNumber}`,
            });

            return true;
        } catch (error) {
            console.error('Error restoring version:', error);
            return false;
        }
    },

    /**
     * Update artifact status with validation
     */
    async updateStatus(
        artifactId: string,
        newStatus: ArtifactStatus,
        userId?: string
    ): Promise<boolean> {
        try {
            const updates: Record<string, any> = { status: newStatus };

            if (newStatus === 'approved') {
                updates.approved_at = new Date().toISOString();
                updates.approved_by = userId;
            }

            const { error } = await supabase
                .from('artifacts')
                .update(updates)
                .eq('id', artifactId);

            return !error;
        } catch (error) {
            console.error('Error updating status:', error);
            return false;
        }
    },

    /**
     * Update a specific version's approval status
     */
    async updateVersionStatus(
        versionId: string,
        params: {
            status: ArtifactVersion['approvalStatus'];
            userId?: string;
            rejectionNote?: string;
        }
    ): Promise<boolean> {
        try {
            const updates: Record<string, any> = {
                approval_status: params.status,
                rejection_note: params.rejectionNote,
            };

            if (params.status === 'approved') {
                updates.approved_at = new Date().toISOString();
                updates.approved_by = params.userId;
            } else {
                updates.approved_at = null;
                updates.approved_by = null;
            }

            const { data: version, error: versionError } = await supabase
                .from('artifact_versions')
                .update(updates)
                .eq('id', versionId)
                .select('artifact_id')
                .single();

            if (versionError || !version) throw versionError;

            // Also update the main artifact status to match
            let mainStatus: ArtifactStatus = 'under_review';
            if (params.status === 'approved') mainStatus = 'approved';
            if (params.status === 'changes_requested') mainStatus = 'changes_requested';
            if (params.status === 'rejected') mainStatus = 'rejected';

            await supabase
                .from('artifacts')
                .update({ 
                    status: mainStatus,
                    approved_at: params.status === 'approved' ? updates.approved_at : undefined,
                    approved_by: params.status === 'approved' ? updates.approved_by : undefined
                })
                .eq('id', version.artifact_id);

            return true;
        } catch (error) {
            console.error('Error updating version status:', error);
            return false;
        }
    },
};

// Helper functions
async function hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mapper to handle DB snake_case -> JS camelCase
// Note: types/architect.ts defines camelCase interfaces, but Supabase returns snake_case by default
// unless configured with a modifier or we map it. Manual mapping is safest here without global config.
function mapDbVersionToType(dbRecord: any): ArtifactVersion {
    return {
        id: dbRecord.id,
        artifactId: dbRecord.artifact_id,
        versionNumber: dbRecord.version_number,
        content: dbRecord.content,
        contentHash: dbRecord.content_hash,
        createdBy: dbRecord.created_by,
        promptUsed: dbRecord.prompt_used,
        modelUsed: dbRecord.model_used,
        userFeedbackTags: dbRecord.user_feedback_tags,
        userFeedbackNote: dbRecord.user_feedback_note,
        diffFromPrevious: dbRecord.diff_from_previous,
        approvalStatus: dbRecord.approval_status || 'pending',
        approvedAt: dbRecord.approved_at,
        approvedBy: dbRecord.approved_by,
        rejectionNote: dbRecord.rejection_note,
        createdAt: dbRecord.created_at,
    };
}
