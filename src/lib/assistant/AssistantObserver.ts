/**
 * ASSISTANT OBSERVER
 * Event-driven system for proactive Assistant nudges
 * 
 * The Observer monitors user activity and project state to surface
 * contextual observations without requiring explicit user request.
 */

// ============================================
// Types
// ============================================

export type NudgePriority = 'low' | 'medium' | 'high';
export type NudgeCategory = 'budget' | 'progress' | 'quality' | 'suggestion' | 'reminder';

export interface AssistantNudge {
    id: string;
    category: NudgeCategory;
    priority: NudgePriority;
    message: string;
    subMessage?: string;
    action?: {
        label: string;
        callback: () => void;
    };
    dismissable: boolean;
    createdAt: string;
    expiresAt?: string;
}

export interface NudgeTrigger {
    id: string;
    category: NudgeCategory;
    priority: NudgePriority;
    condition: (context: NudgeContext) => boolean;
    message: (context: NudgeContext) => string;
    subMessage?: (context: NudgeContext) => string;
    cooldownMinutes: number;
    dismissable: boolean;
}

export interface NudgeContext {
    // Budget
    budgetTotal: number;
    budgetSpent: number;
    budgetRemaining: number;

    // Progress
    totalTasks: number;
    completedTasks: number;
    staleTasks: number; // Tasks unchanged for >3 days

    // Activity
    lastActivityAt: string | null;
    sessionDurationMinutes: number;

    // Sections
    staleSections: string[]; // Section IDs unchanged for >3 days
    currentSectionId: string | null;

    // Quality
    regenerationCount: number;
    averageFeedbackScore: number;
}

// ============================================
// Default Triggers
// ============================================

export const DEFAULT_NUDGE_TRIGGERS: NudgeTrigger[] = [
    // Budget Warning (High Priority)
    {
        id: 'budget-warning-80',
        category: 'budget',
        priority: 'high',
        condition: (ctx) => ctx.budgetTotal > 0 && (ctx.budgetSpent / ctx.budgetTotal) >= 0.8,
        message: () => "You're at 80% of your budget.",
        subMessage: () => "Want me to switch to efficient mode for the rest of this session?",
        cooldownMinutes: 60,
        dismissable: true,
    },

    // Budget Approaching (Medium Priority)
    {
        id: 'budget-warning-60',
        category: 'budget',
        priority: 'medium',
        condition: (ctx) => {
            const pct = ctx.budgetTotal > 0 ? ctx.budgetSpent / ctx.budgetTotal : 0;
            return pct >= 0.6 && pct < 0.8;
        },
        message: () => "Budget check: you're past the halfway point.",
        subMessage: (ctx) => `${Math.round((ctx.budgetSpent / ctx.budgetTotal) * 100)}% spent. Pace looks sustainable.`,
        cooldownMinutes: 240,
        dismissable: true,
    },

    // Stale Section (Medium Priority)
    {
        id: 'stale-section',
        category: 'progress',
        priority: 'medium',
        condition: (ctx) => ctx.staleSections.length > 0,
        message: (ctx) => ctx.staleSections.length === 1
            ? "One section hasn't moved in a while."
            : `${ctx.staleSections.length} sections seem stuck.`,
        subMessage: () => "Want me to draft something to get things moving?",
        cooldownMinutes: 1440, // 24 hours
        dismissable: true,
    },

    // Task Queue Stale (Low Priority)
    {
        id: 'stale-tasks',
        category: 'progress',
        priority: 'low',
        condition: (ctx) => ctx.staleTasks >= 3,
        message: (ctx) => `${ctx.staleTasks} tasks haven't moved in a week.`,
        subMessage: () => "Should we archive these or revisit the priorities?",
        cooldownMinutes: 4320, // 3 days
        dismissable: true,
    },

    // High Regeneration Count (Quality Signal)
    {
        id: 'regeneration-fatigue',
        category: 'quality',
        priority: 'medium',
        condition: (ctx) => ctx.regenerationCount >= 5,
        message: () => "You've regenerated a few times on this one.",
        subMessage: () => "Want me to try a different approach, or should we add more context?",
        cooldownMinutes: 30,
        dismissable: true,
    },

    // Session Duration (Gentle Reminder)
    {
        id: 'long-session',
        category: 'reminder',
        priority: 'low',
        condition: (ctx) => ctx.sessionDurationMinutes >= 90,
        message: () => "You've been at this for a while.",
        subMessage: () => "Just a nudge to stretch or grab water. I'll hold your place.",
        cooldownMinutes: 120,
        dismissable: true,
    },

    // Great Progress (Positive Reinforcement)
    {
        id: 'good-progress',
        category: 'progress',
        priority: 'low',
        condition: (ctx) => {
            const completionRate = ctx.totalTasks > 0 ? ctx.completedTasks / ctx.totalTasks : 0;
            return completionRate >= 0.5 && ctx.completedTasks >= 3;
        },
        message: () => "You're making solid progress.",
        subMessage: (ctx) => `${ctx.completedTasks} tasks done. The finish line is in sight.`,
        cooldownMinutes: 480, // 8 hours
        dismissable: true,
    },
];

// ============================================
// Cooldown Manager
// ============================================

const COOLDOWN_STORAGE_KEY = 'codra:assistant:nudge-cooldowns';

interface CooldownRecord {
    triggerId: string;
    expiresAt: string;
}

function getCooldowns(): CooldownRecord[] {
    try {
        const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
        if (!stored) return [];
        const records = JSON.parse(stored) as CooldownRecord[];
        // Filter out expired cooldowns
        const now = new Date().toISOString();
        return records.filter(r => r.expiresAt > now);
    } catch {
        return [];
    }
}

function setCooldown(triggerId: string, cooldownMinutes: number): void {
    const cooldowns = getCooldowns();
    const expiresAt = new Date(Date.now() + cooldownMinutes * 60 * 1000).toISOString();

    // Remove existing cooldown for this trigger
    const filtered = cooldowns.filter(c => c.triggerId !== triggerId);
    filtered.push({ triggerId, expiresAt });

    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(filtered));
}

function isOnCooldown(triggerId: string): boolean {
    const cooldowns = getCooldowns();
    return cooldowns.some(c => c.triggerId === triggerId);
}

// ============================================
// Observer Engine
// ============================================

/**
 * Evaluate all triggers against current context
 * Returns nudges that should be shown (not on cooldown, condition met)
 */
export function evaluateTriggers(
    context: NudgeContext,
    triggers: NudgeTrigger[] = DEFAULT_NUDGE_TRIGGERS
): AssistantNudge[] {
    const nudges: AssistantNudge[] = [];

    for (const trigger of triggers) {
        // Skip if on cooldown
        if (isOnCooldown(trigger.id)) {
            continue;
        }

        // Check condition
        if (!trigger.condition(context)) {
            continue;
        }

        // Create nudge
        nudges.push({
            id: `nudge-${trigger.id}-${Date.now()}`,
            category: trigger.category,
            priority: trigger.priority,
            message: trigger.message(context),
            subMessage: trigger.subMessage?.(context),
            dismissable: trigger.dismissable,
            createdAt: new Date().toISOString(),
        });

        // Set cooldown
        setCooldown(trigger.id, trigger.cooldownMinutes);
    }

    // Sort by priority (high > medium > low)
    const priorityOrder: Record<NudgePriority, number> = { high: 0, medium: 1, low: 2 };
    nudges.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return nudges;
}

/**
 * Build nudge context from current state
 */
export function buildNudgeContext(params: {
    budgetTotal?: number;
    budgetSpent?: number;
    tasks?: { status: string; updatedAt: string }[];
    sections?: { id: string; updatedAt: string }[];
    currentSectionId?: string | null;
    sessionStartedAt?: string;
    regenerationCount?: number;
}): NudgeContext {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate stale sections (unchanged for 3+ days)
    const staleSections = (params.sections || [])
        .filter(s => new Date(s.updatedAt) < threeDaysAgo)
        .map(s => s.id);

    // Calculate stale tasks (unchanged for 7+ days)
    const staleTasks = (params.tasks || [])
        .filter(t => t.status !== 'done' && new Date(t.updatedAt) < sevenDaysAgo)
        .length;

    // Calculate session duration
    const sessionDurationMinutes = params.sessionStartedAt
        ? Math.floor((now.getTime() - new Date(params.sessionStartedAt).getTime()) / 60000)
        : 0;

    const budgetTotal = params.budgetTotal || 0;
    const budgetSpent = params.budgetSpent || 0;

    return {
        budgetTotal,
        budgetSpent,
        budgetRemaining: budgetTotal - budgetSpent,
        totalTasks: (params.tasks || []).length,
        completedTasks: (params.tasks || []).filter(t => t.status === 'done').length,
        staleTasks,
        lastActivityAt: null, // Could be enhanced later
        sessionDurationMinutes,
        staleSections,
        currentSectionId: params.currentSectionId || null,
        regenerationCount: params.regenerationCount || 0,
        averageFeedbackScore: 0, // Could be enhanced later
    };
}

/**
 * Dismiss a nudge (removes from active list, but doesn't affect cooldown)
 */
export function dismissNudge(nudgeId: string, activeNudges: AssistantNudge[]): AssistantNudge[] {
    return activeNudges.filter(n => n.id !== nudgeId);
}
