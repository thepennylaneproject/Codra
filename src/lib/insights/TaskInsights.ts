/**
 * TASK INSIGHTS ENGINE
 * 
 * Analyzes task completion history to generate insights about 
 * user workflow, cost efficiency, and performance patterns.
 */

import { TaskQueue } from '../../domain/task-queue';
import { ProjectToolId } from '../../domain/types';

export interface TaskInsight {
    type: 'pattern' | 'efficiency' | 'bottleneck';
    title: string;
    description: string;
    deskId?: ProjectToolId;
    severity: 'info' | 'warning' | 'positive';
}

/**
 * Analyze completed tasks to find patterns
 */
export function analyzeTaskPatterns(queue: TaskQueue): TaskInsight[] {
    const insights: TaskInsight[] = [];
    const completedTasks = queue.tasks.filter(t => t.status === 'complete');

    if (completedTasks.length < 3) return insights;

    // 1. Check for rapid completion (Flow State)
    const recentTasks = completedTasks.slice(-3);
    const avgTimeMs = recentTasks.reduce((acc, t) => acc + (t.completionMetadata?.timeTakenMs || 0), 0) / recentTasks.length;

    if (avgTimeMs > 0 && avgTimeMs < 1000 * 60) { // < 1 minute avg
        insights.push({
            type: 'efficiency',
            title: 'High Velocity',
            description: 'You are moving through tasks quickly. Consider batching similar approvals.',
            severity: 'positive'
        });
    }

    // 2. Cost Analysis
    const totalCost = completedTasks.reduce((acc, t) => acc + (t.completionMetadata?.actualCost || 0), 0);
    const estimatedCost = completedTasks.reduce((acc, t) => acc + (t.estimatedCost || 0), 0);

    if (totalCost > 0 && totalCost < estimatedCost * 0.8) {
        insights.push({
            type: 'efficiency',
            title: 'Under Budget',
            description: `You are running ${(100 - (totalCost / estimatedCost) * 100).toFixed(0)}% under estimated costs.`,
            severity: 'positive'
        });
    }

    // 3. Regeneration Fatigue Detection
    const highRegenTasks = completedTasks.filter(t => (t.completionMetadata?.attempts || 1) > 3);
    if (highRegenTasks.length > 0) {
        insights.push({
            type: 'bottleneck',
            title: 'Calibration needed',
            description: 'Several recent tasks required multiple regenerations. Consider refining the visual direction.',
            severity: 'warning'
        });
    }

    return insights;
}

/**
 * Predict duration for a task type based on history
 */
export function predictNextTaskDuration(queue: TaskQueue, deskId: ProjectToolId): number {
    const deskTasks = queue.tasks.filter(t => t.deskId === deskId && t.status === 'complete');
    if (deskTasks.length === 0) return 30000; // Default 30s

    const sum = deskTasks.reduce((acc, t) => acc + (t.completionMetadata?.timeTakenMs || 30000), 0);
    return Math.round(sum / deskTasks.length);
}
