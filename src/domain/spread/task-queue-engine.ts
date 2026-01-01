/**
 * TASK QUEUE ENGINE
 * Generates and manages task queues from Tear Sheet and project context
 * 
 * The task queue is the dynamic TOC - a list of actionable prompts
 * that Lyra will help the user complete.
 */

import {
    SpreadTask,
    TaskQueue,
    TaskPriority,
    TaskStatus,
    TaskCompletionMetadata,
} from '../task-queue';
import {
    Project,
    ProductionDeskId,
    PRODUCTION_DESKS,
} from '../types';
import { ExtendedOnboardingProfile } from '../onboarding-types';
import { smartRouter, SmartRouterTaskType } from '../../lib/ai/router/smart-router';

// ============================================
// Task Generation Strategies
// ============================================

interface TaskTemplate {
    title: string;
    description: string;
    deskId: ProductionDeskId;
    priority: TaskPriority;
    dependencies: string[];
    tearSheetAnchor: string;
    routerTaskType: SmartRouterTaskType;
}

/**
 * Generate task templates based on active desks and project context
 */
function generateTaskTemplates(
    project: Project,
    _profile: ExtendedOnboardingProfile | null,
    activeDesks: ProductionDeskId[]
): TaskTemplate[] {
    const templates: TaskTemplate[] = [];

    // Get project goals to inform task generation
    const goals = project.goals || [];
    const audience = project.audience || 'general audience';

    for (const deskId of activeDesks) {
        const desk = PRODUCTION_DESKS.find(d => d.id === deskId);
        if (!desk) continue;

        // Generate desk-specific tasks based on the desk type
        switch (deskId) {
            case 'design':
                templates.push(
                    {
                        title: 'Create visual direction moodboard',
                        description: `Generate a moodboard capturing the visual essence for ${audience}`,
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'visual_direction',
                        routerTaskType: 'image',
                    },
                    {
                        title: 'Design color palette',
                        description: 'Create a cohesive color palette based on the moodboard',
                        deskId,
                        priority: 'normal',
                        dependencies: [], // Will be filled with moodboard task ID
                        tearSheetAnchor: 'visual_direction',
                        routerTaskType: 'image',
                    },
                    {
                        title: 'Generate hero visual concept',
                        description: 'Create the primary visual that anchors the project',
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'visual_direction',
                        routerTaskType: 'image',
                    }
                );
                break;

            case 'code':
                templates.push(
                    {
                        title: 'Define technical architecture',
                        description: 'Outline the system architecture and key components',
                        deskId,
                        priority: 'critical',
                        dependencies: [],
                        tearSheetAnchor: 'overview',
                        routerTaskType: 'code',
                    },
                    {
                        title: 'Generate core components',
                        description: 'Create the foundational code components',
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'components',
                        routerTaskType: 'code',
                    }
                );
                break;

            case 'write':
                templates.push(
                    {
                        title: 'Craft headline and tagline',
                        description: `Write compelling headlines for ${audience}`,
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'overview',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Write body copy',
                        description: 'Create the main narrative content',
                        deskId,
                        priority: 'normal',
                        dependencies: [],
                        tearSheetAnchor: 'content',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Develop call-to-action copy',
                        description: 'Write persuasive CTAs aligned with goals',
                        deskId,
                        priority: 'normal',
                        dependencies: [],
                        tearSheetAnchor: 'goals',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Create campaign brief',
                        description: 'Outline the marketing strategy and key messages',
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'goals',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Generate social content ideas',
                        description: 'Create content concepts for social platforms',
                        deskId,
                        priority: 'normal',
                        dependencies: [],
                        tearSheetAnchor: 'audience',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Draft resume content',
                        description: 'Create compelling resume content based on profile',
                        deskId,
                        priority: 'critical',
                        dependencies: [],
                        tearSheetAnchor: 'overview',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Write cover letter template',
                        description: 'Generate a customizable cover letter',
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'goals',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Create LinkedIn summary',
                        description: 'Optimize professional summary for LinkedIn',
                        deskId,
                        priority: 'normal',
                        dependencies: [],
                        tearSheetAnchor: 'audience',
                        routerTaskType: 'summary',
                    }
                );
                break;

            case 'analyze':
                templates.push(
                    {
                        title: 'Compile research summary',
                        description: 'Synthesize research findings and insights',
                        deskId,
                        priority: 'high',
                        dependencies: [],
                        tearSheetAnchor: 'overview',
                        routerTaskType: 'reasoning',
                    },
                    {
                        title: 'Create competitive analysis',
                        description: 'Analyze competitors and market positioning',
                        deskId,
                        priority: 'normal',
                        dependencies: [],
                        tearSheetAnchor: 'audience',
                        routerTaskType: 'reasoning',
                    }
                );
                break;
        }
    }

    // Add goal-driven tasks
    for (const goal of goals.slice(0, 3)) {
        templates.push({
            title: `Address goal: ${goal.slice(0, 50)}${goal.length > 50 ? '...' : ''}`,
            description: `Create deliverable addressing: ${goal}`,
            deskId: inferDeskFromGoal(goal, activeDesks),
            priority: 'normal',
            dependencies: [],
            tearSheetAnchor: 'goals',
            routerTaskType: 'chat',
        });
    }

    return templates;
}

/**
 * Infer which desk should handle a goal based on keywords
 */
function inferDeskFromGoal(goal: string, activeDesks: ProductionDeskId[]): ProductionDeskId {
    const lowerGoal = goal.toLowerCase();

    const deskKeywords: Record<ProductionDeskId, string[]> = {
        'design': ['visual', 'design', 'image', 'logo', 'brand', 'color', 'aesthetic'],
        'code': ['build', 'code', 'develop', 'implement', 'technical', 'system', 'api', 'task', 'management', 'issue', 'ticket', 'sprint'],
        'write': [
            'write',
            'content',
            'copy',
            'story',
            'narrative',
            'message',
            'market',
            'campaign',
            'promote',
            'reach',
            'audience',
            'grow',
            'resume',
            'job',
            'career',
            'hire',
            'interview',
            'portfolio',
        ],
        'analyze': ['research', 'analyze', 'data', 'metrics', 'insights', 'trends'],
    };

    // Find best matching desk
    for (const [deskId, keywords] of Object.entries(deskKeywords)) {
        if (activeDesks.includes(deskId as ProductionDeskId)) {
            if (keywords.some(kw => lowerGoal.includes(kw))) {
                return deskId as ProductionDeskId;
            }
        }
    }

    // Default to first active desk
    return activeDesks[0] || 'write';
}

// ============================================
// Task Queue Generation
// ============================================

/**
 * Generate a complete task queue from project and profile data
 */
export function generateTaskQueue(
    project: Project,
    profile: ExtendedOnboardingProfile | null,
    tearSheetVersion: number = 1
): TaskQueue {
    const activeDesks = (project.activeDesks || []) as ProductionDeskId[];
    const templates = generateTaskTemplates(project, profile, activeDesks);

    const now = new Date().toISOString();
    const tasks: SpreadTask[] = [];

    // Convert templates to tasks
    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const taskId = crypto.randomUUID();

        // Estimate cost using SmartRouter
        let estimatedCost = 0.01; // Default fallback
        try {
            const routeResult = smartRouter.route({
                taskType: template.routerTaskType,
                quality: 'balanced',
            });
            // Rough cost estimate based on model
            if (routeResult.selected.modelId.includes('gpt-4')) {
                estimatedCost = 0.05;
            } else if (routeResult.selected.modelId.includes('claude')) {
                estimatedCost = 0.04;
            } else if (routeResult.selected.modelId.includes('flux')) {
                estimatedCost = 0.03;
            } else {
                estimatedCost = 0.01;
            }
        } catch {
            // Use default
        }

        tasks.push({
            id: taskId,
            title: template.title,
            description: template.description,
            deskId: template.deskId,
            status: 'pending',
            order: i + 1,
            priority: template.priority,
            dependencies: [], // Could be enhanced to track real dependencies
            estimatedCost,
            tearSheetAnchor: template.tearSheetAnchor,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Set up dependencies (first task in each desk depends on nothing, subsequent depend on previous)
    const deskTasks: Record<string, SpreadTask[]> = {};
    for (const task of tasks) {
        if (!deskTasks[task.deskId]) {
            deskTasks[task.deskId] = [];
        }
        deskTasks[task.deskId].push(task);
    }

    // Link dependencies within each desk
    for (const deskTaskList of Object.values(deskTasks)) {
        for (let i = 1; i < deskTaskList.length; i++) {
            deskTaskList[i].dependencies = [deskTaskList[i - 1].id];
        }
    }

    return {
        id: crypto.randomUUID(),
        projectId: project.id,
        tasks,
        generatedAt: now,
        tearSheetVersion,
        stale: false,
    };
}

// ============================================
// Task Queue Updates
// ============================================

/**
 * Update a task's status
 */
export function updateTaskStatus(
    queue: TaskQueue,
    taskId: string,
    status: TaskStatus,
    artifactId?: string,
    metadata?: TaskCompletionMetadata
): TaskQueue {
    const now = new Date().toISOString();

    const tasks = queue.tasks.map(task => {
        if (task.id !== taskId) return task;

        return {
            ...task,
            status,
            updatedAt: now,
            completedAt: status === 'complete' ? now : task.completedAt,
            artifactId: artifactId || task.artifactId,
            completionMetadata: metadata ? { ...task.completionMetadata, ...metadata } : task.completionMetadata,
        };
    });

    return { ...queue, tasks };
}

/**
 * Check if the queue needs re-routing due to scope changes
 */
export function detectScopeChange(
    queue: TaskQueue,
    currentTearSheetVersion: number
): boolean {
    return queue.tearSheetVersion !== currentTearSheetVersion;
}

/**
 * Re-route an existing queue when scope changes
 * Returns which tasks were affected
 */
export function rerouteTaskQueue(
    queue: TaskQueue,
    project: Project,
    profile: ExtendedOnboardingProfile | null,
    newTearSheetVersion: number
): { queue: TaskQueue; changedTaskIds: string[] } {
    // For now, regenerate the queue
    // Future: merge with completed tasks from existing queue
    void queue; // Reserved for future merge logic

    const newQueue = generateTaskQueue(project, profile, newTearSheetVersion);

    // Mark as not stale
    newQueue.stale = false;

    // The changed tasks are all the new pending ones
    const changedTaskIds = newQueue.tasks
        .filter(t => t.status !== 'complete')
        .map(t => t.id);

    return { queue: newQueue, changedTaskIds };
}

// ============================================
// Storage
// ============================================

const STORAGE_KEY_PREFIX = 'codra:task-queue:';

/**
 * Load a task queue from storage
 */
export function loadTaskQueue(projectId: string): TaskQueue | null {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as TaskQueue;
    } catch {
        return null;
    }
}

/**
 * Save a task queue to storage
 */
export function saveTaskQueue(queue: TaskQueue): void {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${queue.projectId}`, JSON.stringify(queue));
}
