import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SpreadTask } from '../../domain/task-queue';
import { Play, CheckCircle2, Circle, Clock, AlertCircle, Loader2, Sparkles, Settings } from 'lucide-react';
import { TaskCostBadge } from './TaskCostBadge';
import { TaskOverridePanel } from '@/components/tasks/TaskOverridePanel';
import { analytics } from '@/lib/analytics';
import { useEffectiveSettings } from '../../lib/smart-defaults/hooks/useEffectiveSettings';
import { applyTaskOverrides, saveTaskPattern } from '../../lib/settings/TaskOverrides';
import { useAuth } from '../../lib/auth/AuthProvider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/Button';
import { ExecutionMode } from '@/lib/ai/execution/task-executor';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PromptCardProps {
    task: SpreadTask;
    isActive: boolean;
    executionMode: ExecutionMode;
    runMode: ExecutionMode;
    runState?: 'running' | 'complete' | 'failed';
    isPreviewBlocked: boolean;
    onSelect: (taskId: string) => void;
    onRun: (taskId: string, mode: ExecutionMode) => void;
    className?: string;
}

export function PromptCard({
    task,
    isActive,
    executionMode,
    runMode,
    runState,
    isPreviewBlocked,
    onSelect,
    onRun,
    className
}: PromptCardProps) {
    const { projectId } = useParams<{ projectId: string }>();
    const { user } = useAuth();
    const [showOverridePanel, setShowOverridePanel] = useState(false);
    
    // Get effective settings for this project/task
    const settings = useEffectiveSettings(projectId);
    
    const isRunning = task.status === 'in-progress';
    const isComplete = task.status === 'complete';
    const derivedState = runState
        || (task.status === 'in-progress' ? 'running' : task.status === 'complete' ? 'complete' : undefined);
    const statusLabel = getExecutionStatusLabel(derivedState, runMode);
    const runDisabled = isRunning || isComplete || isPreviewBlocked;
    const runLabel = executionMode === 'preview' ? 'Run preview' : 'Execute workflow';

    const handleApplyOverrides = async (overrides: any, remember: boolean) => {
        analytics.track('flow_task_overrides_applied', {
            taskId: task.id,
            taskType: task.title,
            deskId: task.deskId,
            remember
        });

        // Apply to current task instance
        applyTaskOverrides(task.id, overrides);
        
        // Save as pattern if requested
        if (remember && user) {
            await saveTaskPattern(user.id, {
                deskId: task.deskId as any, // Cast to avoid union mismatch
                taskType: task.title, // Using title as task type for pattern matching
                overrides
            });
        }
        
        setShowOverridePanel(false);
    };

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
                    ? "border-zinc-400 bg-zinc-200/40 shadow-2xl shadow-zinc-500/10 ring-1 ring-zinc-400/30"
                    : "border-[#1A1A1A]/10 bg-white hover:border-[#1A1A1A]/30",
                className
            )}
        >
            {/* Status Indicator (Vertical line) */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-500",
                isComplete ? "bg-emerald-500" :
                    isRunning ? "bg-amber-500" :
                        isActive ? "bg-zinc-600" : "bg-[#1A1A1A]/10"
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
                                        isActive ? "text-zinc-500" : "text-text-soft"
                            )}
                        />
                        <span className="text-xs font-semibold text-text-soft">
                            {task.deskId.replace(/-/g, ' ')}
                        </span>
                        {statusLabel && (
                            <span className="text-[10px] font-semibold text-zinc-500">
                                {statusLabel}
                            </span>
                        )}
                        {task.smartRouting?.isAutoRouted && (
                            <div 
                                className="flex items-center gap-1 bg-zinc-200/50 text-zinc-500 px-2 py-0 rounded-full"
                                title={task.smartRouting.reason}
                            >
                                <Sparkles size={8} fill="currentColor" />
                                <span className="text-xs font-semibold">Smart Route</span>
                            </div>
                        )}
                    </div>
                    {task.estimatedCost && task.estimatedCost > 0 && (
                        <TaskCostBadge cost={task.estimatedCost} />
                    )}
                </div>

                <div>
                    <h3 className={cn(
                        "text-sm font-semibold tracking-tight leading-tight mb-1",
                        isActive ? "text-text-primary" : "text-text-secondary",
                        isComplete && "text-text-soft line-through decoration-[#1A1A1A]/10"
                    )}>
                        {task.title}
                    </h3>
                    <p className="text-xs text-text-soft font-medium leading-relaxed line-clamp-2">
                        {task.description}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Clock size={10} />
                            {task.priority === 'critical' ? 'Fast' : 'Stable'}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Adjust Settings Button */}
                        <Button
                            disabled={isRunning || isComplete}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowOverridePanel(true);
                            }}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isActive 
                                    ? "bg-[#1A1A1A]/10 text-text-primary hover:bg-[#1A1A1A]/20" 
                                    : "bg-[#1A1A1A]/5 text-text-soft hover:text-text-primary hover:bg-[#1A1A1A]/10"
                            )}
                            title="Configure AI settings"
                        >
                            <Settings size={14} strokeWidth={isActive ? 3 : 2} />
                        </Button>

                        <Button
                            disabled={runDisabled}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (executionMode === 'execute') {
                                    analytics.track('flow_task_rerun_triggered', {
                                        taskId: task.id,
                                        taskType: task.title,
                                        deskId: task.deskId
                                    });
                                }
                                onRun(task.id, executionMode);
                            }}
                            className={cn(
                                "p-2 rounded-xl transition-all duration-500",
                                isComplete
                                    ? "bg-emerald-50 text-emerald-500"
                                    : isRunning
                                        ? "bg-amber-50 text-amber-500"
                                        : isActive
                                            ? "bg-[#1A1A1A] text-white shadow-2xl hover:bg-zinc-600 active:scale-90"
                                            : "bg-[#1A1A1A]/5 text-text-soft hover:text-text-primary hover:bg-[#1A1A1A]/10"
                            )}
                            title={runLabel}
                            aria-label={runLabel}
                        >
                            {isComplete ? (
                                <CheckCircle2 size={16} strokeWidth={3} />
                            ) : isRunning ? (
                                <Loader2 size={16} className="animate-spin" strokeWidth={3} />
                            ) : (
                                <Play size={16} fill={isActive ? "currentColor" : "none"} strokeWidth={3} />
                            )}
                        </Button>
                    </div>
                </div>
                {isPreviewBlocked && (
                    <div className="mt-2 text-[10px] font-semibold text-zinc-500">
                        This workflow includes steps that cannot be previewed without side effects.
                    </div>
                )}
            </div>

            {/* Override Panel Modal */}
            {showOverridePanel && (
                <TaskOverridePanel
                    taskType={task.title}
                    currentSettings={{
                        qualityPriority: settings.ai.qualityPriority,
                        maxSteps: settings.ai.maxSteps,
                    }}
                    onApply={handleApplyOverrides}
                    onCancel={() => setShowOverridePanel(false)}
                />
            )}

            {/* Selection indicator dots */}
            {isActive && !isRunning && !isComplete && (
                <div className="absolute top-1 right-1.5 flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                </div>
            )}
        </div>
    );
}

function getExecutionStatusLabel(state: 'running' | 'complete' | 'failed' | undefined, mode: ExecutionMode) {
    const prefix = mode === 'preview' ? 'Preview' : 'Execution';
    if (!state) return '';
    if (state === 'complete') return `${prefix} complete`;
    if (state === 'failed') return `${prefix} failed`;
    if (state === 'running') return `${prefix} running`;
    return `${prefix} running`;
}
