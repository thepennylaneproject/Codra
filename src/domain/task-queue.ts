/**
 * TASK QUEUE DOMAIN TYPES
 * Defines the task queue that drives the dynamic TOC
 * 
 * Tasks are actionable prompts derived from the Tear Sheet.
 * Each task routes to a specific production desk and generates
 * an artifact when executed.
 */

import { ProductionDeskId } from './types';

// ============================================
// Task Status
// ============================================

export type TaskStatus =
    | 'pending'      // Not yet started
    | 'ready'        // Dependencies met, can be executed
    | 'in-progress'  // Currently being generated
    | 'complete'     // Artifact generated successfully
    | 'blocked';     // Waiting on dependencies or guardrail

// ============================================
// Task Priority
// ============================================

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

// ============================================
// Task Metadata
// ============================================

export interface TaskCompletionMetadata {
    /** Time taken to complete in milliseconds */
    timeTakenMs?: number;

    /** Number of attempts or regenerations */
    attempts?: number;

    /** User feedback sentiment */
    userSatisfaction?: 'positive' | 'negative' | 'neutral';

    /** IDs of tools or models used */
    toolsUsed?: string[];

    /** Actual cost incurred */
    actualCost?: number;
}

// ============================================
// Smart Routing Metadata
// ============================================

export interface TaskSmartRoutingMetadata {
    /** The model ID that was selected */
    modelId: string;

    /** The provider ID that was selected */
    providerId: string;

    /** Human-readable reason for the selection */
    reason: string;

    /** Whether this was an automatic system selection */
    isAutoRouted: boolean;
}

// ============================================
// Spread Task
// ============================================

/**
 * A single actionable item in the task queue.
 * Represents a prompt that will be sent to an AI desk.
 */
export interface SpreadTask {
    /** Unique identifier */
    id: string;

    /** Display title (e.g., "Generate hero image concept") */
    title: string;

    /** Brief description of what this task produces */
    description: string;

    /** Which production desk handles this task */
    deskId: ProductionDeskId;

    /** Current execution status */
    status: TaskStatus;

    /** Queue order (1-based) */
    order: number;

    /** Priority level affects queue ordering */
    priority: TaskPriority;

    /** IDs of tasks that must complete first */
    dependencies: string[];

    /** Estimated cost in USD from SmartRouter */
    estimatedCost?: number;

    /** Link to the generated artifact */
    artifactId?: string;

    /** Which Tear Sheet section informed this task */
    tearSheetAnchor?: string;

    /** Raw result of task execution */
    output?: string;

    /** Condensed, prompt-friendly summary of the output for context injection */
    memory?: string;

    /** Timestamp when task was created */
    createdAt: string;

    /** Timestamp when task was last updated */
    updatedAt: string;

    /** Timestamp when task was completed */
    completedAt?: string;

    /** Metadata captured upon completion */
    completionMetadata?: TaskCompletionMetadata;

    /** Smart Routing metadata (if applicable) */
    smartRouting?: TaskSmartRoutingMetadata;
}

// ============================================
// Task Queue
// ============================================

/**
 * The complete task queue for a project.
 * Generated from the Tear Sheet and maintained as the project evolves.
 */
export interface TaskQueue {
    /** Unique identifier */
    id: string;

    /** Associated project */
    projectId: string;

    /** Ordered list of tasks */
    tasks: SpreadTask[];

    /** When this queue was generated */
    generatedAt: string;

    /** Tear Sheet version that generated this queue */
    tearSheetVersion: number;

    /** Whether the queue needs re-routing due to Tear Sheet changes */
    stale: boolean;
}

// ============================================
// Task Queue Events
// ============================================

export type TaskQueueEventType =
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'task_blocked'
    | 'queue_regenerated'
    | 'scope_change_detected';

export interface TaskQueueEvent {
    type: TaskQueueEventType;
    taskId?: string;
    timestamp: string;
    details?: Record<string, unknown>;
}

// ============================================
// Desk to Task Type Mapping
// ============================================

/**
 * Map task workspaces to the types of tasks they handle.
 * Used for automatic desk assignment during task generation.
 */
export const DESK_TASK_TYPES: Record<ProductionDeskId, string[]> = {
    'art-design': [
        'hero-image',
        'illustration',
        'color-palette',
        'typography-system',
        'icon-set',
        'moodboard',
        'layout-mockup',
    ],
    'engineering': [
        'component',
        'api-integration',
        'database-schema',
        'algorithm',
        'architecture-diagram',
        'code-review',
    ],
    'workflow': [
        'editorial-assignment',
        'task-prioritization',
        'status-update',
        'blocker-identification',
        'workflow-optimization',
    ],
    'writing': [
        'headline',
        'body-copy',
        'tagline',
        'script',
        'documentation',
        'blog-post',
    ],
    'marketing': [
        'campaign-brief',
        'social-content',
        'ad-copy',
        'email-sequence',
        'landing-page',
    ],
    'career-assets': [
        'resume',
        'cover-letter',
        'portfolio-piece',
        'linkedin-summary',
        'interview-prep',
    ],
    'data-analysis': [
        'research-summary',
        'competitive-analysis',
        'metrics-dashboard',
        'survey-analysis',
        'trend-report',
    ],
};

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a task is ready to execute (all dependencies met)
 */
export function isTaskReady(task: SpreadTask, allTasks: SpreadTask[]): boolean {
    if (task.status !== 'pending') return false;
    if (task.dependencies.length === 0) return true;

    return task.dependencies.every(depId => {
        const dep = allTasks.find(t => t.id === depId);
        return dep?.status === 'complete';
    });
}

/**
 * Get the next task that's ready to execute
 */
export function getNextReadyTask(queue: TaskQueue): SpreadTask | null {
    // Sort by priority then order
    const priorityOrder: Record<TaskPriority, number> = {
        critical: 0,
        high: 1,
        normal: 2,
        low: 3,
    };

    const readyTasks = queue.tasks
        .filter(t => isTaskReady(t, queue.tasks))
        .sort((a, b) => {
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return a.order - b.order;
        });

    return readyTasks[0] || null;
}

/**
 * Calculate queue progress as a percentage
 */
export function getQueueProgress(queue: TaskQueue): number {
    if (queue.tasks.length === 0) return 0;
    const completed = queue.tasks.filter(t => t.status === 'complete').length;
    return Math.round((completed / queue.tasks.length) * 100);
}

/**
 * Get tasks grouped by status
 */
export function getTasksByStatus(queue: TaskQueue): Record<TaskStatus, SpreadTask[]> {
    const grouped: Record<TaskStatus, SpreadTask[]> = {
        pending: [],
        ready: [],
        'in-progress': [],
        complete: [],
        blocked: [],
    };

    for (const task of queue.tasks) {
        // Upgrade pending tasks to ready if dependencies are met
        if (task.status === 'pending' && isTaskReady(task, queue.tasks)) {
            grouped.ready.push(task);
        } else {
            grouped[task.status].push(task);
        }
    }

    return grouped;
}
