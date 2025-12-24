/**
 * CODRA ESCALATION HOOK
 * Monitors budget thresholds and risk tolerance to trigger Codra interventions
 * 
 * Codra is the system authority - it enforces constraints, budget, and risk.
 * Codra appears only when limits are hit or high-stakes actions occur.
 */

import { useState, useCallback } from 'react';
import { CodraEscalation, EscalationType, BudgetPolicy } from '../domain/types';

// ============================================
// Escalation State
// ============================================

interface EscalationState {
    escalations: CodraEscalation[];
    hasBlockingEscalation: boolean;
}

interface EscalationActions {
    checkBudget: (currentCost: number, policy: BudgetPolicy) => CodraEscalation | null;
    triggerEscalation: (type: EscalationType, message: string, severity: 'warning' | 'blocking') => CodraEscalation;
    resolveEscalation: (escalationId: string) => void;
    clearAll: () => void;
}

// ============================================
// Default Messages
// ============================================

const ESCALATION_MESSAGES: Record<EscalationType, string> = {
    budget_exceeded: 'This action would exceed your budget limits. Review and approve to proceed.',
    risk_exceeded: 'This action exceeds your risk tolerance settings. Confirmation required.',
    destructive_action: 'This action cannot be undone. Please confirm to proceed.',
};

// ============================================
// Hook
// ============================================

export function useCodraEscalation(): EscalationState & EscalationActions {
    const [escalations, setEscalations] = useState<CodraEscalation[]>([]);

    // Check if any escalation is blocking
    const hasBlockingEscalation = escalations.some(e => e.severity === 'blocking' && !e.resolved);

    // Check budget against policy
    const checkBudget = useCallback((currentCost: number, policy: BudgetPolicy): CodraEscalation | null => {
        // Check per-run limit
        if (currentCost > policy.maxCostPerRun) {
            const escalation: CodraEscalation = {
                id: crypto.randomUUID(),
                type: 'budget_exceeded',
                message: `Estimated cost ($${currentCost.toFixed(2)}) exceeds your per-run limit ($${policy.maxCostPerRun}).`,
                severity: policy.approvalRequired ? 'blocking' : 'warning',
                triggeredAt: new Date().toISOString(),
                resolved: false,
            };

            setEscalations(prev => [...prev, escalation]);
            return escalation;
        }

        return null;
    }, []);

    // Trigger a manual escalation
    const triggerEscalation = useCallback((
        type: EscalationType,
        message?: string,
        severity: 'warning' | 'blocking' = 'warning'
    ): CodraEscalation => {
        const escalation: CodraEscalation = {
            id: crypto.randomUUID(),
            type,
            message: message || ESCALATION_MESSAGES[type],
            severity,
            triggeredAt: new Date().toISOString(),
            resolved: false,
        };

        setEscalations(prev => [...prev, escalation]);
        return escalation;
    }, []);

    // Resolve an escalation
    const resolveEscalation = useCallback((escalationId: string) => {
        setEscalations(prev =>
            prev.map(e =>
                e.id === escalationId ? { ...e, resolved: true } : e
            )
        );
    }, []);

    // Clear all escalations
    const clearAll = useCallback(() => {
        setEscalations([]);
    }, []);

    return {
        escalations,
        hasBlockingEscalation,
        checkBudget,
        triggerEscalation,
        resolveEscalation,
        clearAll,
    };
}
