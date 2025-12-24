import { SpreadTask } from '../../domain/task-queue';
import { Play, CheckCircle2, Circle, Clock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { TaskCostBadge } from './TaskCostBadge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PromptCardProps {
    task: SpreadTask;
    isActive: boolean;
    onSelect: (taskId: string) => void;
    onRun: (taskId: string) => void;
    className?: string;
}

export function PromptCard({ task, isActive, onSelect, onRun, className }: PromptCardProps) {
    const isRunning = task.status === 'in-progress';
    const isComplete = task.status === 'complete';

    const statusIcons = {
        pending: Circle,
        'in-progress': Loader2,
        complete: CheckCircle2,
        blocked: AlertCircle,
    };

    const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Circle;

    return (
        <div
            onClick={() => onSelect(task.id)}
            className={cn(
                "group relative p-4 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden",
                isActive
                    ? "border-[#FF4D4D] bg-[#FF4D4D]/5 shadow-2xl shadow-[#FF4D4D]/10 ring-1 ring-[#FF4D4D]/20"
                    : "border-[#1A1A1A]/10 bg-white hover:border-[#1A1A1A]/30",
                className
            )}
        >
            {/* Status Indicator (Vertical line) */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-500",
                isComplete ? "bg-emerald-500" :
                    isRunning ? "bg-amber-500" :
                        isActive ? "bg-[#FF4D4D]" : "bg-[#1A1A1A]/10"
            )} />

            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <StatusIcon
                            size={14}
                            className={cn(
                                isRunning && "animate-spin",
                                isComplete ? "text-emerald-500" :
                                    isRunning ? "text-amber-500" :
                                        isActive ? "text-[#FF4D4D]" : "text-[#8A8A8A]"
                            )}
                        />
                        <span className="text-[10px] font-black text-[#8A8A8A] uppercase tracking-[0.2em]">
                            {task.deskId.replace(/-/g, ' ')}
                        </span>
                        {task.smartRouting?.isAutoRouted && (
                            <div 
                                className="flex items-center gap-1 bg-[#FF4D4D]/10 text-[#FF4D4D] px-2 py-0.5 rounded-full"
                                title={task.smartRouting.reason}
                            >
                                <Sparkles size={8} fill="currentColor" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Smart Route</span>
                            </div>
                        )}
                    </div>
                    {task.estimatedCost && task.estimatedCost > 0 && (
                        <TaskCostBadge cost={task.estimatedCost} />
                    )}
                </div>

                <div>
                    <h3 className={cn(
                        "text-sm font-black tracking-tight leading-tight mb-1",
                        isActive ? "text-[#1A1A1A]" : "text-[#5A5A5A]",
                        isComplete && "text-[#8A8A8A] line-through decoration-[#1A1A1A]/10"
                    )}>
                        {task.title}
                    </h3>
                    <p className="text-[11px] text-[#8A8A8A] font-medium leading-relaxed line-clamp-2">
                        {task.description}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <Clock size={10} />
                            {task.priority === 'critical' ? 'Fast' : 'Stable'}
                        </div>
                    </div>

                    <button
                        disabled={isRunning || isComplete}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRun(task.id);
                        }}
                        className={cn(
                            "p-2 rounded-xl transition-all duration-500",
                            isComplete
                                ? "bg-emerald-50 text-emerald-500"
                                : isRunning
                                    ? "bg-amber-50 text-amber-500"
                                    : isActive
                                        ? "bg-[#1A1A1A] text-white shadow-2xl hover:bg-[#FF4D4D] active:scale-90"
                                        : "bg-[#1A1A1A]/5 text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/10"
                        )}
                    >
                        {isComplete ? (
                            <CheckCircle2 size={16} strokeWidth={3} />
                        ) : isRunning ? (
                            <Loader2 size={16} className="animate-spin" strokeWidth={3} />
                        ) : (
                            <Play size={16} fill={isActive ? "currentColor" : "none"} strokeWidth={3} />
                        )}
                    </button>
                </div>
            </div>

            {/* Selection indicator dots */}
            {isActive && !isRunning && !isComplete && (
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                </div>
            )}
        </div>
    );
}
