import { useState } from 'react';
import { TaskQueue, SpreadTask } from '../../domain/task-queue';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { TaskHistoryItem } from './TaskHistoryItem';
import { 
  History, 
  Search, 
  Filter, 
  SortDesc, 
  ChevronRight,
  X
} from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface TaskHistorySidebarProps {
  taskQueue: TaskQueue | null;
  onReplay: (task: SpreadTask) => void;
  onRemix: (task: SpreadTask) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function TaskHistorySidebar({ 
  taskQueue, 
  onReplay, 
  onRemix, 
  isOpen, 
  onToggle 
}: TaskHistorySidebarProps) {
  const {
    tasks,
    searchQuery,
    setSearchQuery,
    deskFilter,
    setDeskFilter,
    sortBy,
    setSortBy
  } = useTaskHistory(taskQueue);

  const [showFilters, setShowFilters] = useState(false);
  const showTaskReplay = useFeatureFlag(FEATURE_FLAGS.TASK_REPLAY_FEATURE);

  // Derive unique desks for filtering
  const desks = Array.from(new Set(taskQueue?.tasks.map(t => t.deskId) || []));
  const hasTasks = tasks.length > 0;

  if (!showTaskReplay || !hasTasks) {
    return null;
  }

  return (
    <div 
      className={cn(
        "h-full border-l border-zinc-200 bg-white/50 backdrop-blur-sm transition-all duration-300 flex flex-col relative z-30",
        isOpen ? "w-80" : "w-0 overflow-hidden"
      )}
    >
      {/* Toggle Button (Absolute positioned outside when closed) */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="absolute right-full top-1/2 -translate-y-1/2 bg-white border border-zinc-200 border-r-0 rounded-l-xl p-2 shadow-sm hover:pr-4 transition-all"
          title="Open Task History"
        >
          <History size={18} className="text-zinc-600" />
        </Button>
      )}

      {/* Header */}
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white/80 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <History size={16} className="text-zinc-500" />
          <h3 className="font-semibold text-sm text-text-primary">Task History</h3>
          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </div>
        <IconButton variant="ghost" size="sm" onClick={onToggle} aria-label="Close task history">
          <ChevronRight size={16} />
        </IconButton>
      </div>

      {/* Search & Action Bar */}
      <div className="p-3 bg-zinc-50 border-b border-zinc-200 space-y-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={12} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search intent or output..."
            className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-zinc-200 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className={cn(
              "h-7 text-[10px] flex-1 justify-center",
              showFilters && "bg-zinc-200 border-zinc-300"
            )}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter size={10} />}
          >
            Filters
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 text-[10px] flex-1 justify-center"
            onClick={() => setSortBy(sortBy === 'date' ? 'cost' : 'date')}
            leftIcon={<SortDesc size={10} />}
          >
            Sort by {sortBy}
          </Button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="pt-2 flex flex-wrap gap-1 border-t border-zinc-200 mt-2">
            <button
              onClick={() => setDeskFilter(null)}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                deskFilter === null 
                  ? "bg-zinc-800 text-white" 
                  : "bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-400"
              )}
            >
              All Desks
            </button>
            {desks.map(desk => (
              <button
                key={desk}
                onClick={() => setDeskFilter(desk)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-semibold transition-all uppercase",
                  deskFilter === desk 
                    ? "bg-zinc-800 text-white" 
                    : "bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-400"
                )}
              >
                {desk}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {showTaskReplay ? (
          tasks.length > 0 ? (
            <div className="space-y-1">
              {tasks.map(task => (
                <TaskHistoryItem 
                  key={task.id} 
                  task={task} 
                  onReplay={onReplay}
                  onRemix={onRemix}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-40">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <History size={24} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-600">No history found</p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Completed tasks will appear here for quick replay and remixing.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-40">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
              <History size={24} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-600">Task History coming soon</p>
              <p className="text-[10px] text-zinc-500 mt-1">
                We're rolling out task history and replay features to all users soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-[10px] text-zinc-400 font-medium italic">
        Last 50 tasks shown
      </div>
    </div>
  );
}
