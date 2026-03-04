/**
 * COST LEDGER PANEL
 * src/new/components/workspace/CostLedgerPanel.tsx
 *
 * Ledger view of cost entries for the active workspace.
 */

import type { CostLedgerEntry } from '@/lib/execution/cost-ledger';

interface CostLedgerPanelProps {
  projectId: string;
  entries: CostLedgerEntry[];
}

const ENTRY_LABELS: Record<CostLedgerEntry['type'], string> = {
  reserve: 'Reserved',
  commit: 'Committed',
  rollback: 'Rolled back',
  refund: 'Refunded',
};

function formatAmount(amount: number, type: CostLedgerEntry['type']): string {
  const sign = type === 'rollback' || type === 'refund' ? '-' : '+';
  return `${sign}$${amount.toFixed(3)}`;
}

export function CostLedgerPanel({ projectId, entries }: CostLedgerPanelProps) {
  const recentEntries = [...entries]
    .filter((entry) => entry.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return (
    <div className="border-t border-[var(--ui-border)]/15">
      <div className="h-8 px-4 flex items-center border-b border-[var(--ui-border)]/15">
        <span className="text-xs text-text-soft/40 uppercase tracking-widest">
          Cost Ledger
        </span>
      </div>
      <div className="p-4 space-y-3">
        {recentEntries.length === 0 ? (
          <p className="text-xs text-text-soft/50">
            No ledger entries yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentEntries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)]/10 pb-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-text-soft/60">
                    {ENTRY_LABELS[entry.type]}
                  </div>
                  <div className="text-xs text-text-primary truncate">
                    {entry.metadata?.reason ? String(entry.metadata.reason) : entry.taskId || 'Task entry'}
                  </div>
                  <div className="text-[10px] text-text-soft/50">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-text-soft/60 shrink-0">
                  {formatAmount(entry.amount, entry.type)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
