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
                        /* First-Task Guidance */
                        <div className="bg-white border border-[#1A1A1A]/5 rounded-2xl p-6 text-center space-y-4">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF4D4D]/10 flex items-center justify-center">
                                <span className="text-2xl">✨</span>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-[#1A1A1A]">
                                    Ready to Create
                                </h3>
                                <p className="text-xs text-[#8A8A8A] leading-relaxed">
                                    Use the <span className="font-bold text-[#FF4D4D]">Architect</span> panel on the right to add your first AI task, or click a section in the workspace to generate content.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 pt-2">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[#8A8A8A]">
                                    Quick Ideas
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <span className="px-3 py-1.5 bg-[#1A1A1A]/5 rounded-full text-[10px] font-bold text-[#5A5A5A]">
                                        Write hero copy
                                    </span>
                                    <span className="px-3 py-1.5 bg-[#1A1A1A]/5 rounded-full text-[10px] font-bold text-[#5A5A5A]">
                                        Design color palette
                                    </span>
                                    <span className="px-3 py-1.5 bg-[#1A1A1A]/5 rounded-full text-[10px] font-bold text-[#5A5A5A]">
                                        Draft about page
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
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
