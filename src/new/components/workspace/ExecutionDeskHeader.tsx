/**
 * EXECUTION DESK HEADER
 * src/new/components/workspace/ExecutionDeskHeader.tsx
 *
 * Minimal header for the execution desk.
 * Functional, not decorative.
 */


import { PanelLeft, PanelRight, Settings } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';

interface ExecutionDeskHeaderProps {
  projectName: string;
  projectId: string;
  lyraVisible: boolean;
  onToggleLyra: () => void;
  onToggleProof: () => void;
  onOpenSettings?: () => void;
}

export function ExecutionDeskHeader({
  projectName,
  onToggleLyra,
  onToggleProof,
  onOpenSettings,
}: ExecutionDeskHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-transparent">
      {/* Left: Environment + Project name */}
      <div className="flex flex-col gap-1">
        <p className="font-normal text-[#1A1A1A]" style={{ fontSize: '11px', opacity: 0.6 }}>
          Execution Desk
        </p>
        <h1 className="font-normal text-[#1A1A1A]" style={{ fontSize: '14px' }}>{projectName}</h1>
      </div>

      {/* Right: Actions - subdued */}
      <div className="flex items-center gap-1" style={{ opacity: '0.4' }}>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleLyra}
          title="Toggle Lyra (Cmd+\)"
          aria-label="Toggle Lyra panel"
          className="text-[#1A1A1A]"
        >
          <PanelLeft size={14} />
        </IconButton>

        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleProof}
          title="Toggle Task Queue (Cmd+/)"
          aria-label="Toggle Task Queue panel"
          className="text-[#1A1A1A]"
        >
          <PanelRight size={14} />
        </IconButton>

        {onOpenSettings && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            title="Settings (Cmd+,)"
            aria-label="Open settings"
            className="text-[#1A1A1A]"
          >
            <Settings size={14} />
          </IconButton>
        )}
      </div>
    </header>
  );
}
