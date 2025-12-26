import {
    Activity,
    DollarSign,
    Terminal,
    Github,
    Cloud,
    CheckCircle2,
    AlertCircle,
    Info,
    Cpu
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { smartRouter } from '../../../lib/ai/router/smart-router';

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
        <footer className="h-10 border-t border-[#1A1A1A]/10 bg-[#FFFAF0] flex items-center justify-between px-6 shrink-0 z-50 sticky bottom-0">
            {/* Task Progress */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Activity size={12} className="text-[#FF4D4D]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">
                        Production Progress
                    </span>
                    <div className="flex items-center gap-1.5 ml-2">
                        <div className="w-24 h-1.5 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#1A1A1A] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-[#1A1A1A]">
                            {completedTasks}/{totalTasks}
                        </span>
                    </div>
                </div>

                <div className="h-4 w-px bg-[#1A1A1A]/10" />

                <div className="flex items-center gap-2">
                    {status === 'stable' && <CheckCircle2 size={12} className="text-emerald-500" />}
                    {status === 'warning' && <AlertCircle size={12} className="text-amber-500" />}
                    {status === 'error' && <Info size={12} className="text-rose-500" />}
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#8A8A8A]">
                        System {status}
                    </span>
                </div>

                <div className="h-4 w-px bg-[#1A1A1A]/10" />

                {lastRoutingDecision && (
                    <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-[#1A1A1A]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]">
                            {smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId)}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    </div>
                )}
            </div>

            {/* Panel Buttons */}
            {/* Panel Buttons Hidden as per Lyra Audit */}
            <div className="flex items-center gap-1 opacity-0 pointer-events-none">
                <button
                    onClick={() => onToggleBottomPanel('git')}
                    className={cn(
                        "px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2",
                        activeBottomPanel === 'git'
                            ? "bg-[#1A1A1A] text-white"
                            : "text-[#8A8A8A] hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]"
                    )}
                >
                    <Github size={12} />
                    GitHub
                </button>
                <button
                    onClick={() => onToggleBottomPanel('deploy')}
                    className={cn(
                        "px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2",
                        activeBottomPanel === 'deploy'
                            ? "bg-[#1A1A1A] text-white"
                            : "text-[#8A8A8A] hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]"
                    )}
                >
                    <Cloud size={12} />
                    Deploy
                </button>
            </div>

            {/* Budget Tracking */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1 px-3 py-1 rounded-lg bg-[#1A1A1A]/5 ring-1 ring-[#1A1A1A]/5">
                    <div className="flex items-center gap-2">
                        <DollarSign size={10} className="text-[#8A8A8A]" />
                        <span className="text-[10px] font-mono font-bold text-[#1A1A1A]">
                            ${budgetSpent.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#8A8A8A]">/</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-[#8A8A8A]">
                            Limit: ${budgetLimit.toFixed(2)}
                        </span>
                    </div>
                    {sessionCost > 0 && (
                        <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">
                            Session: +${sessionCost.toFixed(3)}
                        </div>
                    )}
                </div>

                <div className="w-px h-4 bg-[#1A1A1A]/10" />

                <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-[#8A8A8A]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#8A8A8A]">
                        v0.2.0
                    </span>
                </div>
            </div>
        </footer>
    );
}
