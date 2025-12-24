/**
 * TASK COST BADGE
 * src/new/components/TaskCostBadge.tsx
 * 
 * Small inline badge for displaying estimated task costs.
 */

import { Calculator } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskCostBadgeProps {
    cost: number;
    label?: string;
    variant?: 'default' | 'preview';
    className?: string;
}

export function TaskCostBadge({ cost, label = 'Est.', variant = 'default', className }: TaskCostBadgeProps) {
    // Dynamic color based on cost
    const getBadgeStyles = () => {
        if (variant === 'preview') return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800';
        if (cost < 0.01) return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
        if (cost < 0.05) return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    };

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all",
            getBadgeStyles(),
            className
        )}>
            <Calculator size={10} />
            <span>{label} ${cost < 0.001 ? '<0.001' : cost.toFixed(3)}</span>
        </div>
    );
}
