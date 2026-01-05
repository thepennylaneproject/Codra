/**
 * BUDGET SEGMENT
 * Real-time spend display with health color coding
 */

import { BudgetStatus } from './hooks';
import { Button } from '@/components/ui/Button';

interface BudgetSegmentProps {
    budget: BudgetStatus;
    onClick?: () => void;
}

export function BudgetSegment({ budget, onClick }: BudgetSegmentProps) {
    const { spentToday, dailyLimit, health } = budget;

    // Determine color based on health
    const healthColor =
        health === 'critical' ? 'text-state-error' :
        health === 'warning' ? 'text-state-warning' :
        'text-state-success';

    return (
        <Button
            onClick={onClick}
            className="flex items-center gap-2 px-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
        >
            <span className={`text-sm font-medium ${healthColor}`}>
                ${spentToday.toFixed(2)}
            </span>
            <span className="text-sm text-zinc-500">/</span>
            <span className="text-sm text-zinc-400">
                ${dailyLimit.toFixed(2)} today
            </span>
        </Button>
    );
}
