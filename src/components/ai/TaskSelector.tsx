/**
 * Task Selector Component
 * Top-level UX entry point: "What do you want to do?"
 */

import React from 'react';
import { TaskCategory } from '../../lib/ai/types-agent-selector';
import { TASK_CATEGORIES } from './TaskCategoryData';
import { cn } from '../../lib/utils';

interface TaskSelectorProps {
    selectedTask?: TaskCategory;
    onTaskSelect: (task: TaskCategory) => void;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({
    selectedTask,
    onTaskSelect
}) => {
    return (
        <div className="space-y-2">
            <label className="text-label-sm text-text-muted">WHAT DO YOU WANT TO DO?</label>
            <div className="grid grid-cols-2 gap-2">
                {TASK_CATEGORIES.map(task => {
                    const isSelected = selectedTask === task.id;

                    return (
                        <button
                            key={task.id}
                            onClick={() => onTaskSelect(task.id)}
                            className={cn(
                                'px-4 py-3 rounded-lg border text-left transition-all',
                                isSelected
                                    ? 'border-brand-magenta bg-brand-magenta/10'
                                    : 'border-border-subtle bg-background-default hover:border-brand-magenta/50'
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{task.icon}</span>
                                <span
                                    className={cn(
                                        'text-label-sm font-semibold',
                                        isSelected ? 'text-brand-magenta' : 'text-text-primary'
                                    )}
                                >
                                    {task.name}
                                </span>
                            </div>
                            <p className="text-body-sm text-text-muted">{task.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskSelector;
