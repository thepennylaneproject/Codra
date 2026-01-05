import { TaskQueue, SpreadTask } from '../../domain/task-queue';
import { PromptCard } from './PromptCard';
import { Search, SortDesc, Sparkles } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/Button';
import { ExecutionMode } from '@/lib/ai/execution/task-executor';
import { getPreviewGuardrail } from '@/lib/ai/execution/preview-guardrails';

interface PromptBacklogProps {
    taskQueue: TaskQueue;
    activeTaskId: string | null;
    onSelectTask: (task: SpreadTask) => void;
    executionMode: ExecutionMode;
    onExecutionModeChange: (mode: ExecutionMode) => void;
    taskRunModes: Record<string, ExecutionMode>;
    taskRunStates: Record<string, 'running' | 'complete' | 'failed'>;
    onRunTask: (taskId: string, mode: ExecutionMode) => void;
}

export function PromptBacklog({
    taskQueue,
    activeTaskId,
    onSelectTask,
    executionMode,
    onExecutionModeChange,
    taskRunModes,
    taskRunStates,
    onRunTask,
}: PromptBacklogProps) {
    const tasks = taskQueue.tasks;
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'complete');
    const runningTasks = tasks.filter(t => t.status === 'in-progress');

    return (
        <div className="flex flex-col h-full bg-ivory border-r border-border-soft">
            {/* Header */}
            <header className="p-6 glass-panel-light border-0 border-b border-border-soft rounded-none bg-white/50 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="type-label text-muted">
                        Prompt Backlog
                    </h2>
                    <span className="bg-ink text-white type-label px-2 py-0 rounded-full">
                        {completedTasks.length}/{tasks.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-soft">Mode</span>
                    <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-border-soft">
                        <Button
                            onClick={() => onExecutionModeChange('preview')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${executionMode === 'preview' ? 'bg-white text-rose-500 shadow-sm' : 'text-text-soft'}`}
                        >
                            Preview
                        </Button>
                        <Button
                            onClick={() => onExecutionModeChange('execute')}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${executionMode === 'execute' ? 'bg-white text-rose-500 shadow-sm' : 'text-text-soft'}`}
                        >
                            Execute
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-text-primary transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Filter production queue..."
                            className="w-full bg-white border border-border-soft rounded-xl pl-8 pr-3 py-2 type-body outline-none focus:ring-1 focus:ring-[#1A1A1A]/10 focus:border-[#1A1A1A] transition-all placeholder:text-muted/50"
                        />
                    </div>
                </div>
            </header>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Running Tasks */}
                {runningTasks.length > 0 && (
                    <div className="space-y-3">
                        <label className="type-label text-zinc-500 block ml-1">
                            Executions in progress
                        </label>
                        <div className="space-y-3">
                            {runningTasks.map(task => (
                                <PromptCard
                                    key={task.id}
                                    task={task}
                                    isActive={task.id === activeTaskId}
                                    executionMode={executionMode}
                                    runMode={taskRunModes[task.id] || executionMode}
                                    runState={taskRunStates[task.id]}
                                    isPreviewBlocked={executionMode === 'preview' && getPreviewGuardrail(task).blocked}
                                    onSelect={() => onSelectTask(task)}
                                    onRun={onRunTask}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Pending Tasks */}
                <div className="space-y-3">
                    <label className="type-label text-muted block ml-1">
                        Pending tasks
                    </label>
                    {pendingTasks.length > 0 ? (
                        <div className="space-y-3">
                            {pendingTasks.map(task => (
                                <PromptCard
                                    key={task.id}
                                    task={task}
                                    isActive={task.id === activeTaskId}
                                    executionMode={executionMode}
                                    runMode={taskRunModes[task.id] || executionMode}
                                    runState={taskRunStates[task.id]}
                                    isPreviewBlocked={executionMode === 'preview' && getPreviewGuardrail(task).blocked}
                                    onSelect={() => onSelectTask(task)}
                                    onRun={onRunTask}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Sparkles}
                            title="Execution idle"
                            description="Use the Architect panel on the right to add your first AI task, or click a section in the workspace to generate content."
                        />
                    )}
                </div>

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div className="opacity-60 space-y-3">
                        <label className="type-label text-emerald-500 block ml-1">
                            Completed tasks
                        </label>
                        <div className="space-y-3">
                            {completedTasks.map(task => (
                                <PromptCard
                                    key={task.id}
                                    task={task}
                                    isActive={task.id === activeTaskId}
                                    executionMode={executionMode}
                                    runMode={taskRunModes[task.id] || executionMode}
                                    runState={taskRunStates[task.id]}
                                    isPreviewBlocked={executionMode === 'preview' && getPreviewGuardrail(task).blocked}
                                    onSelect={() => onSelectTask(task)}
                                    onRun={onRunTask}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <footer className="p-4 border-t border-border-soft bg-white/50">
                <Button 
                    variant="secondary" 
                    size="lg" 
                    className="w-full font-semibold"
                    leftIcon={<SortDesc size={14} />}
                >
                    Auto-prioritize
                </Button>
            </footer>
        </div>
    );
}
