interface BudgetSectionProps {
  dailyLimit: number;
  onChange: (updates: { dailyLimit: number }) => void;
  sessionSpend?: number;
  todaySpend?: number;
}

export function BudgetSection({ dailyLimit, onChange, sessionSpend, todaySpend }: BudgetSectionProps) {
  const spendValue = typeof todaySpend === 'number' ? todaySpend : sessionSpend;
  const utilization = dailyLimit > 0 && spendValue !== undefined ? Math.min(100, (spendValue / dailyLimit) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-text-soft">Daily spend limit</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={Number.isFinite(dailyLimit) ? dailyLimit : 0}
            onChange={(e) => onChange({ dailyLimit: Number(e.target.value) })}
            className="w-32 px-3 py-2 text-sm rounded-lg border border-zinc-200 focus-standard"
          />
          <span className="text-xs text-text-soft">USD</span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-text-soft">
          <span>Spend today</span>
          <span className="font-semibold text-text-primary">
            {typeof spendValue === 'number' ? `$${spendValue.toFixed(2)}` : '—'}
          </span>
        </div>
        {typeof sessionSpend === 'number' && typeof todaySpend === 'number' && (
          <div className="mt-1 flex items-center justify-between text-xs text-text-soft">
            <span>Session spend</span>
            <span className="font-semibold text-text-primary">${sessionSpend.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
          <div className="h-full bg-zinc-700" style={{ width: `${utilization}%` }} />
        </div>
      </div>
    </div>
  );
}
