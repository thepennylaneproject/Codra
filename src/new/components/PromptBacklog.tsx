import { TaskQueue, SpreadTask } from '../../domain/task-queue';
import { PromptCard } from './PromptCard';
import { Search, SortDesc, Sparkles } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

interface PromptBacklogProps {
    taskQueue: TaskQueue;
    activeTaskId: string | null;
    onSelectTask: (task: SpreadTask) => void;
    onRunTask: (taskId: string) => void;
}

export function PromptBacklog({ taskQueue, activeTaskId, onSelectTask, onRunTask }: PromptBacklogProps) {
    const tasks = taskQueue.tasks;
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'complete');
    const runningTasks = tasks.filter(t => t.status === 'in-progress');

    return (
        <div className="flex flex-col h-full bg-ivory border-r border-border-soft">
            {/* Header */}
            <header className="p-6 border-b border-border-soft space-y-4 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <h2 className="type-label text-muted">
                        Prompt Backlog
                    </h2>
                    <span className="bg-ink text-white type-label px-2 py-0.5 rounded-full">
                        {completedTasks.length}/{tasks.length}
                    </span>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-brand-gold transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Filter production queue..."
                            className="w-full bg-white border border-border-soft rounded-xl pl-9 pr-3 py-2 type-body outline-none focus:ring-1 focus:ring-brand-gold/20 focus:border-brand-gold transition-all placeholder:text-muted/50"
                        />
                    </div>
                </div>
            </header>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Running Tasks */}
                {runningTasks.length > 0 && (
                    <div className="space-y-3">
                        <label className="type-label text-brand-gold block ml-1">
                            In Production
                        </label>
                        <div className="space-y-3">
                            {runningTasks.map(task => (
                                <PromptCard
                                    key={task.id}
                                    task={task}
                                    isActive={task.id === activeTaskId}
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
                        Upcoming
                    </label>
                    {pendingTasks.length > 0 ? (
                        <div className="space-y-3">
                            {pendingTasks.map(task => (
                                <PromptCard
                                    key={task.id}
                                    task={task}
                                    isActive={task.id === activeTaskId}
                                    onSelect={() => onSelectTask(task)}
                                    onRun={onRunTask}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Sparkles}
                            title="Ready to Create"
                            description="Use the Architect panel on the right to add your first AI task, or click a section in the workspace to generate content."
                        />
                    )}
                </div>

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div className="opacity-60 space-y-3">
                        <label className="type-label text-emerald-500 block ml-1">
                            Completed
                        </label>
                        <div className="space-y-3">
                            {completedTasks.map(task => (
                                <PromptCard
                                    key={task.id}
                                    task={task}
                                    isActive={task.id === activeTaskId}
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
                    variant="primary" 
                    size="lg" 
                    className="w-full"
                    leftIcon={<SortDesc size={14} strokeWidth={3} />}
                >
                    Auto-Prioritize
                </Button>
            </footer>
        </div>
    );
}
