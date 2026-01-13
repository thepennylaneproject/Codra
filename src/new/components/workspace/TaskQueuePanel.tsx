/**
 * TASK QUEUE PANEL
 * src/new/components/workspace/TaskQueuePanel.tsx
 *
 * Docked panel in the Proof area showing task queue with Run buttons.
 *
 * Features:
 * - List tasks ordered by: pending → running → failed → complete
 * - Run button for pending/failed/timed-out tasks
 * - Cancel button for running tasks
 * - ETA countdown display
 * - Progress indicator for running task
 * - Status badges with appropriate colors
 * - Single-flight: disable all Run buttons when one task is executing
 */

import { Play, RotateCcw, Loader2, Check, AlertCircle, Clock, XCircle, Timer } from 'lucide-react';
import { SpreadTask, TaskStatus } from '../../../domain/task-queue';
import type { ExecutionMode } from '../../../lib/ai/execution/task-executor';
import { formatTimeRemaining } from '../../../hooks/useTaskExecution';
import { Button } from '@/components/ui/Button';

interface TaskQueuePanelProps {
  tasks: SpreadTask[];
  executingTaskId: string | null;
  taskRunStates: Record<string, 'running' | 'complete' | 'failed'>;
  onRunTask: (taskId: string, mode: ExecutionMode) => void;
  onCancelTask?: (taskId: string) => void;
  canExecute?: boolean;
  /** Time remaining in seconds for the currently executing task */
  timeRemaining?: number | null;
}

const statusOrder: Record<TaskStatus, number> = {
  'pending': 0,
  'ready': 1,
  'in-progress': 2,
  'complete': 7,
  'blocked': 3,
  'timed-out': 5,
  'cancelled': 6,
};

function getStatusBadge(status: TaskStatus, isRunning: boolean, hasFailed: boolean) {
  if (isRunning) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
        <Loader2 size={10} className="animate-spin" />
        Running
      </span>
    );
  }
  if (hasFailed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
        <AlertCircle size={10} />
        Failed
      </span>
    );
  }
  switch (status) {
    case 'pending':
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
          <Clock size={10} />
          Pending
        </span>
      );
    case 'in-progress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
          <Loader2 size={10} className="animate-spin" />
          Running
        </span>
      );
    case 'complete':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
          <Check size={10} />
        Complete
        </span>
      );
    case 'blocked':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle size={10} />
          Blocked
        </span>
      );
    case 'timed-out':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
          <Timer size={10} />
          Timed Out
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-zinc-200 text-zinc-600">
          <XCircle size={10} />
          Cancelled
        </span>
      );
    default:
      return null;
  }
}

export function TaskQueuePanel({
  tasks,
  executingTaskId,
  taskRunStates,
  onRunTask,
  onCancelTask,
  canExecute = true,
  timeRemaining,
}: TaskQueuePanelProps) {
  // Sort tasks: pending → running → failed → complete
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusA = a.status as TaskStatus;
    const statusB = b.status as TaskStatus;
    return (statusOrder[statusA] ?? 99) - (statusOrder[statusB] ?? 99);
  });

  const isAnyRunning = Boolean(executingTaskId);

  if (tasks.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xs text-text-soft/50">No tasks in queue</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-8 px-4 flex items-center border-b border-[var(--ui-border)]/15 shrink-0">
        <span className="text-xs text-text-soft/40 uppercase tracking-widest">
          Tasks ({tasks.length})
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-[var(--ui-border)]/10">
          {sortedTasks.map((task) => {
            const status = task.status as TaskStatus;
            const uiState = taskRunStates[task.id];
            const isRunning = uiState === 'running' || executingTaskId === task.id;
            const hasFailed = uiState === 'failed';
            const isTimedOut = status === 'timed-out';
            const isCancelled = status === 'cancelled';
            const canRun = (status === 'pending' || status === 'ready' || hasFailed || isTimedOut) && canExecute && !isAnyRunning;

            return (
              <li key={task.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(status, isRunning, hasFailed)}
                      <span className="text-xs text-text-soft/50 truncate">
                        {task.deskId}
                      </span>
                    </div>

                    {/* Running state with ETA */}
                    {isRunning && (
                      <div className="mt-2 space-y-1">
                        {/* Progress bar */}
                        <div className="w-full bg-zinc-200 h-1 rounded overflow-hidden">
                          <div
                            className="h-1 bg-blue-500 animate-pulse"
                            style={{ width: '50%' }}
                          />
                        </div>
                        {/* ETA display */}
                        <p className="text-xs text-blue-600">
                          Generating... {timeRemaining !== null && timeRemaining !== undefined
                            ? formatTimeRemaining(timeRemaining)
                            : ''}
                        </p>
                      </div>
                    )}

                    {/* Timed out message */}
                    {isTimedOut && (
                      <p className="mt-1 text-xs text-amber-700">
                        Task exceeded timeout limit.
                      </p>
                    )}

                    {/* Cancelled message with timestamp */}
                    {isCancelled && task.cancelledAt && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Cancelled by user at {new Date(task.cancelledAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Cancel Button - visible while running */}
                    {isRunning && onCancelTask && (
                      <Button
                        onClick={() => onCancelTask(task.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        aria-label="Cancel task"
                      >
                        <XCircle size={10} />
                        Cancel
                      </Button>
                    )}

                    {/* Run/Retry Button */}
                    {canRun && (
                      <Button
                        data-tour="run-button"
                        onClick={() => onRunTask(task.id, 'execute')}
                        disabled={!canRun}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={hasFailed || isTimedOut ? 'Retry task' : 'Run task'}
                      >
                        {hasFailed || isTimedOut ? (
                          <>
                            <RotateCcw size={10} />
                            Retry
                          </>
                        ) : (
                          <>
                            <Play size={10} />
                            Run
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
