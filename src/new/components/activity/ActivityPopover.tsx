/**
 * ACTIVITY POPOVER
 * Small detail popover for budget breakdown and alert details
 */

import { X } from 'lucide-react';
import { BudgetBreakdown } from './hooks';
import { Alert } from './hooks';

interface BudgetPopoverContentProps {
    breakdown: BudgetBreakdown;
    onClose: () => void;
}

interface AlertPopoverContentProps {
    alert: Alert;
    onDismiss: () => void;
}

type ActivityPopoverProps =
    | ({ type: 'budget' } & BudgetPopoverContentProps)
    | ({ type: 'alert' } & AlertPopoverContentProps);

export function ActivityPopover(props: ActivityPopoverProps) {
    if (props.type === 'budget') {
        return <BudgetPopoverContent {...props} />;
    }
    return <AlertPopoverContent {...props} />;
}

function BudgetPopoverContent({ breakdown, onClose }: BudgetPopoverContentProps) {
    return (
        <div className="absolute bottom-12 right-4 w-80 bg-[#1A1A1A] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-200">Budget Breakdown</span>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Daily */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Today</span>
                        <span className="text-xs text-zinc-500">
                            {((breakdown.daily.spent / breakdown.daily.limit) * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-zinc-200">
                            ${breakdown.daily.spent.toFixed(2)}
                        </span>
                        <span className="text-sm text-zinc-500">
                            / ${breakdown.daily.limit.toFixed(2)}
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#FF6B6B] rounded-full transition-all"
                            style={{ width: `${Math.min(100, (breakdown.daily.spent / breakdown.daily.limit) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Weekly */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">This Week</span>
                        <span className="text-xs text-zinc-500">
                            {((breakdown.weekly.spent / breakdown.weekly.limit) * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-zinc-300">
                            ${breakdown.weekly.spent.toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-500">
                            / ${breakdown.weekly.limit.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Monthly */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">This Month</span>
                        <span className="text-xs text-zinc-500">
                            {((breakdown.monthly.spent / breakdown.monthly.limit) * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-zinc-300">
                            ${breakdown.monthly.spent.toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-500">
                            / ${breakdown.monthly.limit.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AlertPopoverContent({ alert, onDismiss }: AlertPopoverContentProps) {
    return (
        <div className="absolute bottom-12 left-4 w-96 bg-[#1A1A1A] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-200">Alert Details</span>
                <button
                    onClick={onDismiss}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                    {alert.message}
                </p>

                {alert.details && (
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            {alert.details}
                        </p>
                    </div>
                )}

                <button
                    onClick={onDismiss}
                    className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
