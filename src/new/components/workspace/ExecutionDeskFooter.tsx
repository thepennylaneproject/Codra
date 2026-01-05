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
    <footer className="h-full flex items-center justify-between px-6 bg-transparent">
      {/* Left: Progress - factual */}
      <div className="flex items-center">
        {hasProgress && (
          <span className="text-[10px] text-text-soft/40 tabular-nums">
            {completedTasks} of {totalTasks}
          </span>
        )}
      </div>

      {/* Right: Cost & Lock - factual */}
      <div className="flex items-center gap-4">
        {sessionCost > 0 && (
          <span className="text-[10px] text-text-soft/40 tabular-nums">
            ${sessionCost.toFixed(4)}
          </span>
        )}

        {isLocked && (
          <span className="text-[10px] text-text-soft/60">
            Locked
          </span>
        )}
      </div>
    </footer>
  );
}
