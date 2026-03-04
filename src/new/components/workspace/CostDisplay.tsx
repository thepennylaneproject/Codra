import { formatCost } from '@/lib/ai/registry/client';

interface CostDisplayProps {
  estimated: number;
  spent: number;
  remaining: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export function CostDisplay({ estimated, spent, remaining, status }: CostDisplayProps) {
  const statusClass =
    status === 'exceeded'
      ? 'cost-display--exceeded'
      : status === 'warning'
        ? 'cost-display--approaching'
        : '';

  const safeRemaining = Math.max(0, remaining);

  return (
    <div className={`cost-display ${statusClass}`}>
      <span className="cost-display__range">
        Est <span className="cost-display__expected">{formatCost(estimated)}</span>
        {' '}• Spent {formatCost(spent)}
        {' '}• Rem {formatCost(safeRemaining)}
      </span>
    </div>
  );
}
