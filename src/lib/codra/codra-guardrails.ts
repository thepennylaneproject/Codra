/**
 * CODRA GUARDRAILS
 * Boundary enforcement system
 * 
 * Codra is the boundaries. This module checks guardrails before
 * task execution and determines if escalation is needed.
 */

import {
    CodraGuardrail,
    BudgetPolicy,
    Project,
    CodraEscalation,
    EscalationType,
} from '../../domain/types';
import { SpreadTask, TaskQueue, getQueueProgress } from '../../domain/task-queue';

// ============================================
// Guardrail Check Functions
// ============================================

/**
 * Check all guardrails for a task before execution
 */
export function checkGuardrails(
    task: SpreadTask,
    project: Project,
    queue: TaskQueue,
    budgetSpent: number = 0
): CodraGuardrail[] {
    const guardrails: CodraGuardrail[] = [];
    const budgetPolicy = project.budgetPolicy;

    // Budget guardrail - per run
    if (budgetPolicy?.maxCostPerRun) {
        const estimatedCost = task.estimatedCost || 0.01;
        const threshold = budgetPolicy.maxCostPerRun;

        guardrails.push({
            id: crypto.randomUUID(),
            type: 'budget',
            label: 'Per-run cost limit',
            threshold,
            currentValue: estimatedCost,
            status: estimatedCost > threshold ? 'exceeded'
                : estimatedCost > threshold * 0.8 ? 'warning'
                    : 'ok',
        });
    }

    // Budget guardrail - daily limit
    if (budgetPolicy?.dailyLimit) {
        const threshold = budgetPolicy.dailyLimit;
        const estimatedTotal = budgetSpent + (task.estimatedCost || 0.01);

        guardrails.push({
            id: crypto.randomUUID(),
            type: 'budget',
            label: 'Daily budget limit',
            threshold,
            currentValue: estimatedTotal,
            status: estimatedTotal > threshold ? 'exceeded'
                : estimatedTotal > threshold * 0.8 ? 'warning'
                    : 'ok',
        });
    }

    // Scope guardrail - check if too many tasks are blocked
    const blockedCount = queue.tasks.filter(t => t.status === 'blocked').length;
    const blockedThreshold = Math.ceil(queue.tasks.length * 0.3); // 30% blocked is concerning

    if (blockedCount > 0) {
        guardrails.push({
            id: crypto.randomUUID(),
            type: 'scope',
            label: 'Blocked tasks',
            threshold: blockedThreshold,
            currentValue: blockedCount,
            status: blockedCount >= blockedThreshold ? 'exceeded'
                : blockedCount >= blockedThreshold * 0.6 ? 'warning'
                    : 'ok',
        });
    }

    // Quality guardrail - check overall progress
    const progress = getQueueProgress(queue);
    guardrails.push({
        id: crypto.randomUUID(),
        type: 'quality',
        label: 'Queue progress',
        threshold: 100,
        currentValue: progress,
        status: 'ok', // Progress is informational
    });

    return guardrails;
}

/**
 * Determine if any guardrails require escalation
 */
export function shouldEscalate(guardrails: CodraGuardrail[]): boolean {
    return guardrails.some(g => g.status === 'exceeded');
}

/**
 * Get guardrails that are in warning or exceeded status
 */
export function getActiveGuardrails(guardrails: CodraGuardrail[]): CodraGuardrail[] {
    return guardrails.filter(g => g.status !== 'ok');
}

// ============================================
// Escalation Generation
// ============================================

/**
 * Generate an escalation from violated guardrails
 */
export function createEscalation(
    guardrails: CodraGuardrail[],
    task: SpreadTask
): CodraEscalation | null {
    const exceeded = guardrails.filter(g => g.status === 'exceeded');

    if (exceeded.length === 0) return null;

    // Determine escalation type based on guardrail type
    const types = exceeded.map(g => g.type);
    let escalationType: EscalationType = 'risk_exceeded';

    if (types.includes('budget')) {
        escalationType = 'budget_exceeded';
    }

    // Build message
    const violations = exceeded.map(g =>
        `${g.label}: ${g.currentValue.toFixed(2)} / ${g.threshold.toFixed(2)}`
    ).join('\n');

    const message = `Cannot execute "${task.title}" due to guardrail violations:\n\n${violations}`;

    return {
        id: crypto.randomUUID(),
        type: escalationType,
        message,
        severity: 'blocking',
        triggeredAt: new Date().toISOString(),
        resolved: false,
    };
}

// ============================================
// Budget Tracking
// ============================================

const BUDGET_STORAGE_KEY = 'codra:daily-budget:';

interface DailyBudget {
    date: string; // YYYY-MM-DD
    spent: number;
    runs: number;
}

/**
 * Get today's budget spending
 */
export function getTodaysBudget(projectId: string): DailyBudget {
    const today = new Date().toISOString().split('T')[0];
    const key = `${BUDGET_STORAGE_KEY}${projectId}:${today}`;

    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored) as DailyBudget;
        } catch {
            // Fall through to default
        }
    }

    return { date: today, spent: 0, runs: 0 };
}

/**
 * Record a task execution cost
 */
export function recordTaskCost(projectId: string, cost: number): void {
    const budget = getTodaysBudget(projectId);
    budget.spent += cost;
    budget.runs += 1;

    const key = `${BUDGET_STORAGE_KEY}${projectId}:${budget.date}`;
    localStorage.setItem(key, JSON.stringify(budget));
}

/**
 * Get budget summary for display
 */
export function getBudgetSummary(
    projectId: string,
    policy: BudgetPolicy | undefined
): {
    spent: number;
    limit: number;
    percentage: number;
    status: 'ok' | 'warning' | 'exceeded';
} {
    const budget = getTodaysBudget(projectId);
    const limit = policy?.dailyLimit || 10; // Default $10/day
    const percentage = Math.round((budget.spent / limit) * 100);

    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';

    return {
        spent: budget.spent,
        limit,
        percentage: Math.min(percentage, 100),
        status,
    };
}

// ============================================
// Codra Voice
// ============================================

/**
 * Get a Codra-style message for the current guardrail state
 */
export function getCodraMessage(guardrails: CodraGuardrail[]): string | null {
    const active = getActiveGuardrails(guardrails);

    if (active.length === 0) return null;

    const exceeded = active.filter(g => g.status === 'exceeded');
    const warnings = active.filter(g => g.status === 'warning');

    if (exceeded.length > 0) {
        const messages = [
            "This exceeds agreed-upon limits.",
            "The boundaries we set are here for a reason.",
            "Consider adjusting scope or budget before proceeding.",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    if (warnings.length > 0) {
        const messages = [
            "Approaching project limits.",
            "Budget getting tight—plan accordingly.",
            "Consider this a gentle reminder of our constraints.",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    return null;
}
