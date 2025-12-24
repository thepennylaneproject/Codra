import { TaskQueue, SpreadTask } from '../../domain/task-queue';
import { PromptCard } from './PromptCard';
import { Search, SortDesc } from 'lucide-react';

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
        <div className="flex flex-col h-full bg-[#FFFAF0]/50 border-r border-[#1A1A1A]/10">
            {/* Header */}
            <header className="p-6 border-b border-[#1A1A1A]/5 space-y-4 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black tracking-[0.3em] text-[#8A8A8A] uppercase">
                        Prompt Backlog
                    </h2>
                    <span className="bg-[#1A1A1A] text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">
                        {completedTasks.length}/{tasks.length}
                    </span>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] group-focus-within:text-[#FF4D4D] transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Filter production queue..."
                            className="w-full bg-white border border-[#1A1A1A]/10 rounded-xl pl-9 pr-3 py-2 text-[11px] font-medium outline-none focus:ring-1 focus:ring-[#FF4D4D]/20 focus:border-[#FF4D4D]/50 transition-all placeholder:text-[#8A8A8A]/50"
                        />
                    </div>
                </div>
            </header>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Running Tasks */}
                {runningTasks.length > 0 && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[#FF4D4D] uppercase tracking-[0.2em] block ml-1">
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
                    <label className="text-[10px] font-black text-[#8A8A8A] uppercase tracking-[0.2em] block ml-1">
                        Upcoming
                    </label>
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
                </div>

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div className="opacity-60 space-y-3">
                        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block ml-1">
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
            <footer className="p-4 border-t border-[#1A1A1A]/10 bg-white/50">
                <button className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#FF4D4D] transition-all flex items-center justify-center gap-2 shadow-xl">
                    <SortDesc size={14} strokeWidth={3} />
                    Auto-Prioritize
                </button>
            </footer>
        </div>
    );
}
