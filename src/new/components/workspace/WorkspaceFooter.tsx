/**
 * WORKSPACE FOOTER
 * src/new/components/workspace/WorkspaceFooter.tsx
 *
 * Minimal footer showing execution status.
 * Cost and lock moments are explicit and rare.
 */



interface WorkspaceFooterProps {
  completedTasks?: number;
  totalTasks?: number;
  sessionCost?: number;
  isLocked?: boolean;
}

export function WorkspaceFooter({
  completedTasks = 0,
  totalTasks = 0,
  sessionCost = 0,
  isLocked = false,
}: WorkspaceFooterProps) {
  const hasProgress = totalTasks > 0;

  return (
    <footer className="flex items-center justify-between bg-transparent">
      {/* Left: Progress - factual */}
      <div className="flex items-center">
        {hasProgress && (
          <span className="font-normal text-[#1A1A1A] opacity-35 tabular-nums" style={{ fontSize: '11px' }}>
            {completedTasks} of {totalTasks}
          </span>
        )}
      </div>

      {/* Right: Cost & Lock - factual */}
      <div className="flex items-center gap-4">
        {sessionCost > 0 && (
          <span className="font-normal text-[#1A1A1A] opacity-35 tabular-nums" style={{ fontSize: '11px' }}>
            ${sessionCost.toFixed(4)}
          </span>
        )}

        {isLocked && (
          <span className="font-normal text-[#1A1A1A]" style={{ fontSize: '11px', opacity: '0.6' }}>
            Locked
          </span>
        )}
      </div>
    </footer>
  );
}
