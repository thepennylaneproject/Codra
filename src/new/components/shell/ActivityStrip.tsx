import { Github, Cloud } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { smartRouter } from '../../../lib/ai/router/smart-router';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ActivityStripProps {
    completedTasks: number;
    totalTasks: number;
    budgetSpent: number;
    budgetLimit: number;
    activeBottomPanel: 'git' | 'deploy' | 'preview' | null;
    onToggleBottomPanel: (panel: 'git' | 'deploy' | 'preview') => void;
    status?: 'stable' | 'warning' | 'error';
}

/**
 * ACTIVITY STRIP
 * The bottom status bar for the Codra Editorial pipeline.
 * Displays progress, budget, and system status with Ivory & Ink aesthetic.
 */
export function ActivityStrip({
    completedTasks,
    totalTasks,
    budgetSpent,
    budgetLimit,
    activeBottomPanel,
    onToggleBottomPanel,
    status = 'stable'
}: ActivityStripProps) {
    const { lastRoutingDecision, sessionCost } = useFlowStore();
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <footer className="h-10 glass-panel-light border-0 border-t border-[var(--ui-border)] rounded-none bg-[var(--ui-bg)]/80 flex items-center justify-between px-6 shrink-0 z-50 sticky bottom-0">
            {/* Task Progress */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-soft">
                        Progress
                    </span>
                    <div className="flex items-center gap-2 ml-1">
                        <div className="w-32 h-1 bg-[var(--ui-border-soft)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--ui-text)] transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-text-primary">
                            {completedTasks}/{totalTasks}
                        </span>
                    </div>
                </div>

                <div className="h-4 w-px bg-[var(--ui-border)]" />

                <div className="flex items-center gap-2">
                    {status === 'stable' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {status === 'warning' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    {status === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    <span className="text-xs font-normal text-text-soft">
                        System {status}
                    </span>
                </div>

                <div className="h-4 w-px bg-[var(--ui-border)]" />

                {lastRoutingDecision && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                            {smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId)}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    </div>
                )}
            </div>

            {/* Panel Buttons */}
            {/* Panel Buttons Hidden as per Lyra Audit */}
            <div className="flex items-center gap-1 opacity-0 pointer-events-none">
                <Button
                    onClick={() => onToggleBottomPanel('git')}
                    className={cn(
                        "px-4 py-1 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center gap-2",
                        activeBottomPanel === 'git'
                            ? "bg-[var(--ui-text)] text-background-default"
                            : "text-text-soft hover:bg-[var(--ui-border-soft)] hover:text-text-primary"
                    )}
                >
                    <Github size={12} />
                    GitHub
                </Button>
                <Button
                    onClick={() => onToggleBottomPanel('deploy')}
                    className={cn(
                        "px-4 py-1 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center gap-2",
                        activeBottomPanel === 'deploy'
                            ? "bg-[var(--ui-text)] text-background-default"
                            : "text-text-soft hover:bg-[var(--ui-border-soft)] hover:text-text-primary"
                    )}
                >
                    <Cloud size={12} />
                    Deploy
                </Button>
            </div>

            {/* Budget Tracking */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-0 rounded border border-[var(--ui-border-soft)]">
                    <span className="text-xs font-mono text-text-primary">
                        ${budgetSpent.toFixed(2)}
                    </span>
                    <span className="text-xs text-text-soft">/</span>
                    <span className="text-xs font-medium text-text-soft">
                        ${budgetLimit.toFixed(0)} limit
                    </span>
                    {sessionCost > 0 && (
                        <span className="text-xs font-medium text-emerald-600 ml-1">
                            (+${sessionCost.toFixed(2)})
                        </span>
                    )}
                </div>

                <div className="w-px h-4 bg-[var(--ui-border)]" />
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-soft">
                        v0.2.0
                    </span>
                </div>
            </div>
        </footer>
    );
}
