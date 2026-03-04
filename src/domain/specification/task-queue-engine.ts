/**
 * TASK QUEUE ENGINE
 * Generates and manages task queues from project context and spread
 * 
 * The task queue is the dynamic TOC - a list of actionable prompts
 * that Lyra will help the user complete.
 */

import {
    SpecificationTask,
    TaskQueue,
    TaskPriority,
    TaskStatus,
    TaskCompletionMetadata,
} from '../task-queue';
import {
    Project,
    ProjectToolId,
    PROJECT_TOOLS,
} from '../types';
import { ExtendedOnboardingProfile } from '../onboarding-types';
import { smartRouter, SmartRouterTaskType } from '../../lib/ai/router/smart-router';
import { storageAdapter } from '../../lib/storage/StorageKeyAdapter';

// ============================================
// Task Generation Strategies
// ============================================

interface TaskTemplate {
    title: string;
    description: string;
    toolId: ProjectToolId;
    priority: TaskPriority;
    dependencies: string[];
    contextAnchor: string;
    routerTaskType: SmartRouterTaskType;
}

/**
 * Generate task templates based on active desks and project context
 */
function generateTaskTemplates(
    project: Project,
    _profile: ExtendedOnboardingProfile | null,
    activeTools: ProjectToolId[]
): TaskTemplate[] {
    const templates: TaskTemplate[] = [];

    // Get project goals to inform task generation
    const goals = project.goals || [];
    const audience = project.audience || 'general audience';

    for (const toolId of activeTools) {
        const tool = PROJECT_TOOLS.find(d => d.id === toolId);
        if (!tool) continue;

        // Generate tool-specific tasks based on the tool type
        switch (toolId) {
            case 'design':
                templates.push(
                    {
                        title: 'Create visual direction moodboard',
                        description: `Generate a moodboard capturing the visual essence for ${audience}`,
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'visual_direction',
                        routerTaskType: 'image',
                    },
                    {
                        title: 'Design color palette',
                        description: 'Create a cohesive color palette based on the moodboard',
                        toolId,
                        priority: 'normal',
                        dependencies: [], // Will be filled with moodboard task ID
                        contextAnchor: 'visual_direction',
                        routerTaskType: 'image',
                    },
                    {
                        title: 'Generate hero visual concept',
                        description: 'Create the primary visual that anchors the project',
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'visual_direction',
                        routerTaskType: 'image',
                    }
                );
                break;

            case 'code':
                templates.push(
                    {
                        title: 'Define technical architecture',
                        description: 'Outline the system architecture and key components',
                        toolId,
                        priority: 'critical',
                        dependencies: [],
                        contextAnchor: 'overview',
                        routerTaskType: 'code',
                    },
                    {
                        title: 'Generate core components',
                        description: 'Create the foundational code components',
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'components',
                        routerTaskType: 'code',
                    }
                );
                break;

            case 'copy':
                templates.push(
                    {
                        title: 'Craft headline and tagline',
                        description: `Write compelling headlines for ${audience}`,
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'overview',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Write body copy',
                        description: 'Create the main narrative content',
                        toolId,
                        priority: 'normal',
                        dependencies: [],
                        contextAnchor: 'content',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Develop call-to-action copy',
                        description: 'Write persuasive CTAs aligned with goals',
                        toolId,
                        priority: 'normal',
                        dependencies: [],
                        contextAnchor: 'goals',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Create campaign brief',
                        description: 'Outline the marketing strategy and key messages',
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'goals',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Generate social content ideas',
                        description: 'Create content concepts for social platforms',
                        toolId,
                        priority: 'normal',
                        dependencies: [],
                        contextAnchor: 'audience',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Draft resume content',
                        description: 'Create compelling resume content based on profile',
                        toolId,
                        priority: 'critical',
                        dependencies: [],
                        contextAnchor: 'overview',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Write cover letter template',
                        description: 'Generate a customizable cover letter',
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'goals',
                        routerTaskType: 'summary',
                    },
                    {
                        title: 'Create LinkedIn summary',
                        description: 'Optimize professional summary for LinkedIn',
                        toolId,
                        priority: 'normal',
                        dependencies: [],
                        contextAnchor: 'audience',
                        routerTaskType: 'summary',
                    }
                );
                break;

            case 'data':
                templates.push(
                    {
                        title: 'Compile research summary',
                        description: 'Synthesize research findings and insights',
                        toolId,
                        priority: 'high',
                        dependencies: [],
                        contextAnchor: 'overview',
                        routerTaskType: 'reasoning',
                    },
                    {
                        title: 'Create competitive analysis',
                        description: 'Analyze competitors and market positioning',
                        toolId,
                        priority: 'normal',
                        dependencies: [],
                        contextAnchor: 'audience',
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
            toolId: inferToolFromGoal(goal, activeTools),
            priority: 'normal',
            dependencies: [],
            contextAnchor: 'goals',
            routerTaskType: 'chat',
        });
    }

    return templates;
}

/**
 * Infer which tool should handle a goal based on keywords
 */
function inferToolFromGoal(goal: string, activeTools: ProjectToolId[]): ProjectToolId {
    const lowerGoal = goal.toLowerCase();

    const toolKeywords: Record<ProjectToolId, string[]> = {
        'design': ['visual', 'design', 'image', 'logo', 'brand', 'color', 'aesthetic'],
        'code': ['build', 'code', 'develop', 'implement', 'technical', 'system', 'api', 'task', 'management', 'issue', 'ticket', 'sprint'],
        'copy': [
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
        'data': ['research', 'analyze', 'data', 'metrics', 'insights', 'trends'],
    };

    // Find best matching tool
    for (const [toolId, keywords] of Object.entries(toolKeywords)) {
        if (activeTools.includes(toolId as ProjectToolId)) {
            if (keywords.some(kw => lowerGoal.includes(kw))) {
                return toolId as ProjectToolId;
            }
        }
    }

    // Default to first active tool
    return activeTools[0] || 'copy';
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
    contextVersion: number = 1
): TaskQueue {
    const activeTools = (project.activeTools || []) as ProjectToolId[];
    const templates = generateTaskTemplates(project, profile, activeTools);

    const now = new Date().toISOString();
    const tasks: SpecificationTask[] = [];

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
            toolId: template.toolId,
            deskId: template.toolId,
            status: 'pending',
            order: i + 1,
            priority: template.priority,
            dependencies: [], // Could be enhanced to track real dependencies
            estimatedCost,
            contextAnchor: template.contextAnchor,
            createdAt: now,
            updatedAt: now,
        });
    }

    // Set up dependencies (first task in each tool depends on nothing, subsequent depend on previous)
    const toolTasks: Record<string, SpecificationTask[]> = {};
    for (const task of tasks) {
        if (!toolTasks[task.toolId]) {
            toolTasks[task.toolId] = [];
        }
        toolTasks[task.toolId].push(task);
    }

    // Link dependencies within each tool
    for (const toolTaskList of Object.values(toolTasks)) {
        for (let i = 1; i < toolTaskList.length; i++) {
            toolTaskList[i].dependencies = [toolTaskList[i - 1].id];
        }
    }

    return {
        id: crypto.randomUUID(),
        projectId: project.id,
        tasks,
        generatedAt: now,
        contextVersion,
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
    currentContextVersion: number
): boolean {
    return (queue.contextVersion ?? queue.tearSheetVersion ?? 1) !== currentContextVersion;
}

/**
 * Re-route an existing queue when scope changes
 * Returns which tasks were affected
 */
export function rerouteTaskQueue(
    queue: TaskQueue,
    project: Project,
    profile: ExtendedOnboardingProfile | null,
    newContextVersion: number
): { queue: TaskQueue; changedTaskIds: string[] } {
    // For now, regenerate the queue
    // Future: merge with completed tasks from existing queue
    void queue; // Reserved for future merge logic

    const newQueue = generateTaskQueue(project, profile, newContextVersion);

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

function normalizeTaskQueue(queue: TaskQueue): TaskQueue {
    const contextVersion = queue.contextVersion ?? (queue as any).tearSheetVersion ?? 1;
    const tasks = queue.tasks.map((task) => ({
        ...task,
        contextAnchor: task.contextAnchor ?? (task as any).tearSheetAnchor,
    }));

    return {
        ...queue,
        contextVersion,
        tasks,
    };
}

function canonicalizeTaskQueue(queue: TaskQueue): TaskQueue {
    const normalized = normalizeTaskQueue(queue);
    const tasks = normalized.tasks.map((task) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tearSheetAnchor, ...rest } = task as any;
        return rest as SpecificationTask;
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tearSheetVersion, ...restQueue } = normalized as any;
    return {
        ...restQueue,
        tasks,
    } as TaskQueue;
}

/**
 * Load a task queue from storage
 */
export function loadTaskQueue(projectId: string): TaskQueue | null {
    const stored = storageAdapter.getTaskQueue(projectId);
    if (!stored) return null;
    return normalizeTaskQueue(stored as TaskQueue);
}

/**
 * Save a task queue to storage
 */
export function saveTaskQueue(queue: TaskQueue): void {
    const canonicalQueue = canonicalizeTaskQueue(queue);
    storageAdapter.saveTaskQueue(queue.projectId, canonicalQueue);
}
