/**
 * GOALS SECTION
 * Interactive priority stacking for project goals
 */

import { Target, ChevronUp, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { Button } from '@/components/ui/Button';

interface Goal {
    text: string;
    priority: 'primary' | 'secondary';
    completed?: boolean;
}

interface GoalsSectionProps {
    content: any;
    isEditing?: boolean;
    onUpdate?: (content: any) => void;
}

export function GoalsSection({ content, isEditing, onUpdate }: GoalsSectionProps) {
    const goals = (content.goals as Goal[]) || [];

    const handleTogglePriority = (index: number) => {
        if (!onUpdate) return;
        const newGoals = [...goals];
        newGoals[index].priority = newGoals[index].priority === 'primary' ? 'secondary' : 'primary';
        onUpdate({ ...content, goals: newGoals });
    };

    const handleToggleComplete = (index: number) => {
        if (!onUpdate) return;
        const newGoals = [...goals];
        newGoals[index].completed = !newGoals[index].completed;
        onUpdate({ ...content, goals: newGoals });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <span className="block text-xs text-zinc-400 font-semibold">
                    Priority Stacking
                </span>
                <p className="text-xs text-zinc-400 font-medium">Drag to reorder</p>
            </div>

            <div className="space-y-3">
                {goals.map((goal, i) => (
                    <div
                        key={i}
                        className={`
                            group flex items-start gap-4 p-4 rounded-xl border transition-all
                            ${goal.priority === 'primary'
                                ? 'bg-white dark:bg-zinc-900 border-rose-100 dark:border-rose-500/20 shadow-sm shadow-rose-500/5'
                                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800'
                            }
                            ${goal.completed ? 'opacity-60' : ''}
                        `}
                    >
                        {/* Status Icon */}
                        <Button
                            onClick={() => handleToggleComplete(i)}
                            className={`mt-1 transition-colors ${goal.completed ? 'text-green-500' : 'text-zinc-300 hover:text-zinc-400'}`}
                        >
                            {goal.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </Button>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`
                                    px-1 py-0 text-xs font-semibold rounded
                                    ${goal.priority === 'primary' ? 'bg-rose-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}
                                `}>
                                    {goal.priority}
                                </span>
                                {goal.completed && (
                                    <span className="text-xs font-semibold text-green-600">Completed</span>
                                )}
                            </div>
                            <p className={`text-sm leading-relaxed ${goal.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                {goal.text}
                            </p>
                        </div>

                        {/* Controls (visible in editing or hover) */}
                        {isEditing && (
                            <div className="flex flex-col gap-1">
                                <Button
                                    onClick={() => handleTogglePriority(i)}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-rose-500"
                                    title="Toggle Priority"
                                >
                                    {goal.priority === 'primary' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </Button>
                                <Target size={14} className="mx-auto text-zinc-300" />
                            </div>
                        )}
                    </div>
                ))}

                {goals.length === 0 && (
                    <EmptyState
                        icon={Target}
                        title="No project goals defined yet"
                        description="Add goals to guide the direction of your project."
                    />
                )}
            </div>

            {isEditing && (
                <Button className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-400 hover:border-rose-200 hover:text-rose-500 transition-all">
                    + Add Strategic Goal
                </Button>
            )}
        </div>
    );
}
