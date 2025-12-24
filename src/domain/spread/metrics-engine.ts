import { TaskQueue, SpreadTask } from '../task-queue';
import { BudgetPolicy } from '../types';

export interface ProjectMetrics {
    progress: number;            // 0-100
    burnRate: number;            // USD per day (actual)
    projectedCost: number;       // USD total (estimated + actual)
    velocity: number;            // Tasks per day
    healthStatus: 'healthy' | 'warning' | 'critical';
    daysActive: number;
}

/**
 * METRICS ENGINE
 * Computes project health, progress, and financial metrics from
 * the Task Queue and project context.
 */
export const MetricsEngine = {
    /**
     * Calculate comprehensive project metrics
     */
    calculateMetrics(
        queue: TaskQueue,
        budgetPolicy: BudgetPolicy,
        actualSpent: number = 0
    ): ProjectMetrics {
        const tasks = queue.tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'complete');

        // 1. Progress
        const progress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

        // 2. Days Active
        const firstBatchDate = new Date(queue.generatedAt);
        const now = new Date();
        const daysActive = Math.max(1, Math.ceil((now.getTime() - firstBatchDate.getTime()) / (1000 * 60 * 60 * 24)));

        // 3. Burn Rate (Actual)
        const burnRate = actualSpent / daysActive;

        // 4. Projected Cost
        // Sum of actual spent + estimated cost of remaining tasks
        const estimatedRemaining = tasks
            .filter(t => t.status !== 'complete')
            .reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
        const projectedCost = actualSpent + estimatedRemaining;

        // 5. Velocity
        const velocity = completedTasks.length / daysActive;

        // 6. Health Status
        let healthStatus: ProjectMetrics['healthStatus'] = 'healthy';

        // If projected cost exceeds daily limit * 30 (as a monthly proxy) or directly violates limits
        if (projectedCost > budgetPolicy.dailyLimit * 7) {
            healthStatus = 'warning';
        }
        if (burnRate > budgetPolicy.dailyLimit || actualSpent > budgetPolicy.dailyLimit * 30) {
            healthStatus = 'critical';
        }

        return {
            progress,
            burnRate,
            projectedCost,
            velocity,
            healthStatus,
            daysActive
        };
    },

    /**
     * Estimate cost of a set of tasks
     */
    estimateTaskSetCost(tasks: SpreadTask[]): number {
        return tasks.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
    }
};
