import { SpreadTask } from '../../domain/task-queue';
import { Button } from '../ui/Button';
import { Clock, Zap, Edit3, DollarSign, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskHistoryItemProps {
  task: SpreadTask;
  onReplay: (task: SpreadTask) => void;
  onRemix: (task: SpreadTask) => void;
}

export function TaskHistoryItem({ task, onReplay, onRemix }: TaskHistoryItemProps) {
  const completedDate = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);
  const cost = task.completionMetadata?.actualCost ?? task.estimatedCost ?? 0;
  const status = task.status;

  return (
    <div className="group p-3 hover:bg-zinc-100/80 rounded-xl transition-all border border-transparent hover:border-zinc-200 bg-white/40 mb-2">
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-xs font-semibold text-text-primary truncate flex-1 mr-2" title={task.title}>
          {task.title}
        </h4>
        <span className="text-[10px] text-text-soft whitespace-nowrap flex items-center gap-1">
          <Clock size={8} />
          {formatDistanceToNow(completedDate, { addSuffix: true })}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-text-soft mb-2">
        <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-mono uppercase tracking-wider">
          {task.deskId}
        </span>
        <span>•</span>
        <span className="flex items-center">
          <DollarSign size={8} className="mr-0.5" />
          {cost.toFixed(3)}
        </span>
        <span>•</span>
        <div className="flex items-center gap-1">
          {status === 'complete' ? (
            <CheckCircle2 size={10} className="text-emerald-500" />
          ) : status === 'blocked' ? (
            <XCircle size={10} className="text-rose-500" />
          ) : (
            <PlayCircle size={10} className="text-blue-500" />
          )}
          <span className="capitalize">{status}</span>
        </div>
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-7 text-[10px] px-2 py-0 flex-1 hover:bg-zinc-800 hover:text-white"
          onClick={() => onReplay(task)}
          leftIcon={<Zap size={10} />}
        >
          Replay
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 text-[10px] px-2 py-0 flex-1 border border-zinc-200 hover:bg-white"
          onClick={() => onRemix(task)}
          leftIcon={<Edit3 size={10} />}
        >
          Remix
        </Button>
      </div>
    </div>
  );
}
