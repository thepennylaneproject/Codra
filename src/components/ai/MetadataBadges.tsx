/**
 * Badge Components for Model Metadata
 * Display cost tiers, latency tiers, and other metadata
 */

import React from 'react';
import { CostTier, LatencyTier } from '../../lib/ai/types-agent-selector';
import { cn } from '../../lib/utils';

interface CostBadgeProps {
    tier: CostTier;
    className?: string;
}

export const CostBadge: React.FC<CostBadgeProps> = ({ tier, className }) => {
    const config = {
        free: { label: 'Free', color: 'text-state-success bg-state-success/10 border-state-success/30' },
        low: { label: 'Low Cost', color: 'text-state-success bg-state-success/10 border-state-success/30' },
        medium: { label: 'Medium', color: 'text-brand-gold bg-brand-gold/10 border-brand-gold/30' },
        high: { label: 'High Cost', color: 'text-state-warning bg-state-warning/10 border-state-warning/30' },
        premium: { label: 'Premium', color: 'text-brand-magenta bg-brand-magenta/10 border-brand-magenta/30' }
    };

    const { label, color } = config[tier];

    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-label-xs', color, className)}>
            💰 {label}
        </span>
    );
};

interface LatencyBadgeProps {
    tier: LatencyTier;
    className?: string;
}

export const LatencyBadge: React.FC<LatencyBadgeProps> = ({ tier, className }) => {
    const config = {
        fast: { label: 'Fast', color: 'text-state-success bg-state-success/10 border-state-success/30' },
        medium: { label: 'Medium', color: 'text-brand-gold bg-brand-gold/10 border-brand-gold/30' },
        slow: { label: 'Slow', color: 'text-state-warning bg-state-warning/10 border-state-warning/30' }
    };

    const { label, color } = config[tier];

    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-label-xs', color, className)}>
            ⚡ {label}
        </span>
    );
};
