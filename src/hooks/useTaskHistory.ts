import { useMemo, useState } from 'react';
import { TaskQueue } from '../domain/task-queue';

export function useTaskHistory(taskQueue: TaskQueue | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deskFilter, setDeskFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  const historyTasks = useMemo(() => {
    if (!taskQueue) return [];

    // Only show completed tasks in history
    let tasks = taskQueue.tasks.filter(t => t.status === 'complete');

    // Filter by search query (intent/title)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.output?.toLowerCase().includes(query)
      );
    }

    // Filter by desk
    if (deskFilter) {
      tasks = tasks.filter(t => t.deskId === deskFilter);
    }

    // Sort
    tasks.sort((a, b) => {
      if (sortBy === 'date') {
        const timeA = new Date(a.completedAt || a.updatedAt).getTime();
        const timeB = new Date(b.completedAt || b.updatedAt).getTime();
        return timeB - timeA;
      } else if (sortBy === 'cost') {
        return (b.completionMetadata?.actualCost || 0) - (a.completionMetadata?.actualCost || 0);
      }
      return 0;
    });

    return tasks;
  }, [taskQueue, searchQuery, deskFilter, sortBy]);

  return {
    tasks: historyTasks,
    searchQuery,
    setSearchQuery,
    deskFilter,
    setDeskFilter,
    sortBy,
    setSortBy,
    isLoading: !taskQueue,
  };
}
