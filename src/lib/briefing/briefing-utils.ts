/**
 * BRIEFING UTILITIES
 * Helper functions for phase detection, project stats, adaptive language, and change detection
 */

import type { ProjectTask, ProjectWorkstream, Artifact, TaskPrompt } from '../../types/architect';
import type { ProjectPhase, ProjectStats, ChangeReport } from './briefing-store';

// ============================================================================
// Phase Detection
// ============================================================================

/**
 * Derive the current project phase based on task and workflow state
 */
export function deriveProjectPhase(
    tasks: ProjectTask[],
    workstreams: ProjectWorkstream[],
    artifacts: Artifact[]
): ProjectPhase {
    if (tasks.length === 0 && workstreams.length === 0) {
        return 'planning';
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const inReviewTasks = tasks.filter(t => t.status === 'in_review');
    const approvedArtifacts = artifacts.filter(a => a.status === 'approved');

    const completionRate = tasks.length > 0
        ? completedTasks.length / tasks.length
        : 0;

    // Shipping: Most tasks done, artifacts approved
    if (completionRate >= 0.8 && approvedArtifacts.length > 0) {
        return 'shipping';
    }

    // Testing: Many tasks in review
    if (inReviewTasks.length > inProgressTasks.length && completionRate >= 0.5) {
        return 'testing';
    }

    // Building: Active work happening
    if (inProgressTasks.length > 0 || completedTasks.length > 0) {
        return 'building';
    }

    // Default to planning
    return 'planning';
}

/**
 * Get human-readable phase label
 */
export function getPhaseLabel(phase: ProjectPhase): string {
    const labels: Record<ProjectPhase, string> = {
        planning: 'Planning',
        building: 'Building',
        testing: 'Testing',
        shipping: 'Shipping',
    };
    return labels[phase];
}

/**
 * Get phase emoji
 */
export function getPhaseEmoji(phase: ProjectPhase): string {
    const emojis: Record<ProjectPhase, string> = {
        planning: '📋',
        building: '🔨',
        testing: '🧪',
        shipping: '🚀',
    };
    return emojis[phase];
}

// ============================================================================
// Project Stats
// ============================================================================

/**
 * Calculate project statistics
 */
export function getProjectStats(
    tasks: ProjectTask[],
    prompts: TaskPrompt[],
    artifacts: Artifact[]
): ProjectStats {
    // Count flows (artifacts of type 'flow')
    const flowCount = artifacts.filter(a => a.type === 'flow').length;

    // Count assets (icons, illustrations, etc.)
    const assetTypes = ['icon', 'illustration', 'component', 'page'];
    const assetCount = artifacts.filter(a => assetTypes.includes(a.type)).length;

    return {
        flowCount,
        promptCount: prompts.length,
        taskCount: tasks.length,
        completedTaskCount: tasks.filter(t => t.status === 'completed').length,
        assetCount,
    };
}

/**
 * Format stats for display
 */
export function formatStatsLine(stats: ProjectStats): string {
    const parts: string[] = [];

    if (stats.flowCount > 0) {
        parts.push(`${stats.flowCount} flow${stats.flowCount !== 1 ? 's' : ''}`);
    }
    if (stats.promptCount > 0) {
        parts.push(`${stats.promptCount} prompt${stats.promptCount !== 1 ? 's' : ''}`);
    }
    if (stats.taskCount > 0) {
        parts.push(`${stats.taskCount} task${stats.taskCount !== 1 ? 's' : ''} (${stats.completedTaskCount} done)`);
    }
    if (stats.assetCount > 0) {
        parts.push(`${stats.assetCount} asset${stats.assetCount !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'No content yet';
}

// ============================================================================
// Adaptive Language
// ============================================================================

/**
 * Language adaptations for non-technical users
 */
const LANGUAGE_ADAPTATIONS: Record<string, string> = {
    'Inspect flow': 'Review automation',
    'Execute': 'Run',
    'Modify prompt': 'Adjust instructions',
    'Deploy': 'Publish',
    'Refactor': 'Reorganize',
    'Debug': 'Fix issues',
    'API': 'connection',
    'Component': 'building block',
    'Render': 'display',
};

/**
 * Adapt technical language for non-technical users
 */
export function adaptLanguage(text: string, isNonTechnical: boolean): string {
    if (!isNonTechnical) return text;

    let adapted = text;
    for (const [technical, friendly] of Object.entries(LANGUAGE_ADAPTATIONS)) {
        adapted = adapted.replace(new RegExp(technical, 'gi'), friendly);
    }
    return adapted;
}

/**
 * Determine if user appears non-technical based on signals
 */
export function isNonTechnicalUser(signals: {
    hasOpenedStudio: boolean;
    hasEditedFlows: boolean;
    interactionCount: number;
}): boolean {
    // User who has interacted a lot but never touched Studio or flows
    if (signals.interactionCount > 5 && !signals.hasOpenedStudio && !signals.hasEditedFlows) {
        return true;
    }
    return false;
}

// ============================================================================
// Change Detection
// ============================================================================

/**
 * Compute a hash representing the project state
 * Used to detect significant changes for re-onboarding
 */
export function computeProjectStateHash(
    tasks: ProjectTask[],
    prompts: TaskPrompt[],
    artifacts: Artifact[],
    workstreams: ProjectWorkstream[]
): string {
    // Create a simple hash based on counts and IDs
    const state = {
        taskIds: tasks.map(t => t.id).sort(),
        promptIds: prompts.map(p => p.id).sort(),
        artifactIds: artifacts.map(a => a.id).sort(),
        workstreamIds: workstreams.map(w => w.id).sort(),
        taskCount: tasks.length,
        promptCount: prompts.length,
        artifactCount: artifacts.length,
        workstreamCount: workstreams.length,
    };

    // Simple hash from stringified state
    const stateString = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
        const char = stateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Parse state hashes and detect what changed
 */
export function detectSignificantChanges(
    oldTasks: ProjectTask[],
    oldPrompts: TaskPrompt[],
    oldArtifacts: Artifact[],
    newTasks: ProjectTask[],
    newPrompts: TaskPrompt[],
    newArtifacts: Artifact[]
): ChangeReport {
    const changes: ChangeReport['changes'] = [];

    // Check for new tasks
    const oldTaskIds = new Set(oldTasks.map(t => t.id));
    const newTaskCount = newTasks.filter(t => !oldTaskIds.has(t.id)).length;
    if (newTaskCount > 0) {
        changes.push({
            type: 'tasks_added',
            count: newTaskCount,
            description: `${newTaskCount} new task${newTaskCount !== 1 ? 's' : ''} added`,
        });
    }

    // Check for new prompts
    const oldPromptIds = new Set(oldPrompts.map(p => p.id));
    const newPromptCount = newPrompts.filter(p => !oldPromptIds.has(p.id)).length;
    if (newPromptCount > 0) {
        changes.push({
            type: 'prompts_added',
            count: newPromptCount,
            description: `${newPromptCount} new prompt${newPromptCount !== 1 ? 's' : ''} added`,
        });
    }

    // Check for new flows
    const oldFlowIds = new Set(oldArtifacts.filter(a => a.type === 'flow').map(a => a.id));
    const newFlows = newArtifacts.filter(a => a.type === 'flow' && !oldFlowIds.has(a.id));
    if (newFlows.length > 0) {
        changes.push({
            type: 'flows_added',
            count: newFlows.length,
            description: `${newFlows.length} new flow${newFlows.length !== 1 ? 's' : ''} added`,
        });
    }

    return {
        hasSignificantChanges: changes.length > 0,
        changes,
    };
}

// ============================================================================
// Next Action Suggestions
// ============================================================================

export interface NextAction {
    id: string;
    label: string;
    description: string;
    type: 'claim_task' | 'create_flow' | 'run_flow' | 'generate_asset' | 'review' | 'archive';
    targetId?: string;
    priority: number;
}

/**
 * Generate next action suggestions based on project state
 */
export function getNextActions(
    tasks: ProjectTask[],
    artifacts: Artifact[],
    _prompts: TaskPrompt[]
): NextAction[] {
    const actions: NextAction[] = [];

    // 1. Unassigned tasks → suggest claiming
    const unassignedTasks = tasks.filter(t =>
        !t.assignedTo && t.status === 'ready'
    );
    if (unassignedTasks.length > 0) {
        actions.push({
            id: 'claim-task',
            label: 'Claim a task',
            description: `${unassignedTasks.length} task${unassignedTasks.length !== 1 ? 's' : ''} ready to be claimed`,
            type: 'claim_task',
            targetId: unassignedTasks[0].id,
            priority: 1,
        });
    }

    // 2. Tasks but no flows → suggest creating
    const flows = artifacts.filter(a => a.type === 'flow');
    if (tasks.length > 0 && flows.length === 0) {
        actions.push({
            id: 'create-flow',
            label: 'Create a flow',
            description: 'No automations yet. Create your first flow.',
            type: 'create_flow',
            priority: 2,
        });
    }

    // 3. Flows but not executed → suggest running
    const draftFlows = flows.filter(f => f.status === 'draft');
    if (draftFlows.length > 0) {
        actions.push({
            id: 'run-flow',
            label: 'Test a flow',
            description: `${draftFlows.length} flow${draftFlows.length !== 1 ? 's' : ''} haven't been tested yet`,
            type: 'run_flow',
            targetId: draftFlows[0].id,
            priority: 3,
        });
    }

    // 4. Missing assets → suggest generating
    const designTasks = tasks.filter(t =>
        ['icon', 'illustration', 'design'].includes(t.type) &&
        t.status !== 'completed'
    );
    if (designTasks.length > 0) {
        actions.push({
            id: 'generate-asset',
            label: 'Generate assets',
            description: `${designTasks.length} design task${designTasks.length !== 1 ? 's' : ''} need assets`,
            type: 'generate_asset',
            targetId: designTasks[0].id,
            priority: 4,
        });
    }

    // 5. All looks done → suggest review
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (tasks.length > 0 && completedTasks.length === tasks.length) {
        actions.push({
            id: 'review-project',
            label: 'Review & polish',
            description: 'All tasks complete! Review before shipping.',
            type: 'review',
            priority: 5,
        });
    }

    // Sort by priority and return top 3
    return actions.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format relative time for "last activity" display
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}
