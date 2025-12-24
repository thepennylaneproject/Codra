/**
 * BUDGET PREDICTOR
 * Forecasts project costs based on pending tasks and historical data.
 */

import { TaskQueue } from '../../domain/task-queue';

export interface BudgetForecast {
    currentSpend: number;
    projectedSpend: number;
    remainingBudget: number;
    tasksRemaining: number;
    status: 'on-track' | 'at-risk' | 'over-budget';
}

/**
 * Calculate budget forecast
 */
export function forecastBudget(
    queue: TaskQueue,
    totalBudget: number,
    currentSpend: number
): BudgetForecast {
    // Calculate pending cost
    const pendingTasks = queue.tasks.filter(t => t.status === 'pending' || t.status === 'ready' || t.status === 'in-progress');

    // Sum estimated costs
    // If estimatedCost is missing, assume average cost of $0.02
    const projectedAdditionalCost = pendingTasks.reduce((acc, t) => acc + (t.estimatedCost || 0.02), 0);

    const projectedSpend = currentSpend + projectedAdditionalCost;
    const remainingBudget = totalBudget - currentSpend;

    let status: BudgetForecast['status'] = 'on-track';
    if (projectedSpend > totalBudget) {
        status = 'over-budget';
    } else if (projectedSpend > totalBudget * 0.9) {
        status = 'at-risk';
    }

    return {
        currentSpend,
        projectedSpend,
        remainingBudget,
        tasksRemaining: pendingTasks.length,
        status
    };
}
