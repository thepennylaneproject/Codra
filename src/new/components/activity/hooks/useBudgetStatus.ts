/**
 * USE BUDGET STATUS
 * Hook for budget-specific logic and health calculation
 */

import { useState, useCallback, useMemo } from 'react';

export interface BudgetStatus {
    spentToday: number;
    dailyLimit: number;
    health: 'healthy' | 'warning' | 'critical';
}

export interface BudgetBreakdown {
    daily: { spent: number; limit: number };
    weekly: { spent: number; limit: number };
    monthly: { spent: number; limit: number };
}

const WARNING_THRESHOLD = 0.8;  // 80%
const CRITICAL_THRESHOLD = 1.0; // 100%

export function useBudgetStatus(initialLimit: number = 50) {
    const [spentToday, setSpentToday] = useState(0);
    const [dailyLimit] = useState(initialLimit);

    // Calculate health based on spend percentage
    const health = useMemo((): BudgetStatus['health'] => {
        const percentage = spentToday / dailyLimit;

        if (percentage >= CRITICAL_THRESHOLD) return 'critical';
        if (percentage >= WARNING_THRESHOLD) return 'warning';
        return 'healthy';
    }, [spentToday, dailyLimit]);

    // Add spend
    const addSpend = useCallback((amount: number) => {
        setSpentToday(prev => prev + amount);
    }, []);

    // Reset daily spend (called at midnight or manually)
    const resetDaily = useCallback(() => {
        setSpentToday(0);
    }, []);

    // Get budget breakdown (TODO: integrate with actual backend)
    const getBreakdown = useCallback((): BudgetBreakdown => {
        return {
            daily: { spent: spentToday, limit: dailyLimit },
            weekly: { spent: spentToday * 7, limit: dailyLimit * 7 }, // Placeholder
            monthly: { spent: spentToday * 30, limit: dailyLimit * 30 }, // Placeholder
        };
    }, [spentToday, dailyLimit]);

    const status: BudgetStatus = {
        spentToday,
        dailyLimit,
        health,
    };

    return {
        status,
        addSpend,
        resetDaily,
        getBreakdown,
    };
}
