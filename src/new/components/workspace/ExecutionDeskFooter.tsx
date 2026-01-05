/**
 * EXECUTION DESK FOOTER
 * src/new/components/workspace/ExecutionDeskFooter.tsx
 *
 * Minimal footer showing execution status.
 * Cost and lock moments are explicit and rare.
 */

import React from 'react';
import { DollarSign, Lock } from 'lucide-react';

interface ExecutionDeskFooterProps {
  completedTasks?: number;
  totalTasks?: number;
  sessionCost?: number;
  isLocked?: boolean;
}

export function ExecutionDeskFooter({
  completedTasks = 0,
  totalTasks = 0,
  sessionCost = 0,
  isLocked = false,
}: ExecutionDeskFooterProps) {
  const hasProgress = totalTasks > 0;
  const progressPercent = hasProgress ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <footer className="h-full flex items-center justify-between px-6 bg-[var(--ui-bg)]/60 border-t border-[var(--ui-border)]">
      {/* Left: Progress */}
      <div className="flex items-center gap-4">
        {hasProgress && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-text-soft tabular-nums">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        )}
      </div>

      {/* Right: Cost & Lock status */}
      <div className="flex items-center gap-4">
        {/* Session cost - explicit when non-zero */}
        {sessionCost > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-text-soft">
            <DollarSign size={10} />
            <span className="tabular-nums">{sessionCost.toFixed(4)}</span>
          </div>
        )}

        {/* Lock indicator - explicit when locked */}
        {isLocked && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-medium">
            <Lock size={10} />
            <span>Locked</span>
          </div>
        )}
      </div>
    </footer>
  );
}
