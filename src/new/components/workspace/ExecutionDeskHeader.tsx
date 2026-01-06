/**
 * EXECUTION DESK HEADER
 * src/new/components/workspace/ExecutionDeskHeader.tsx
 *
 * Minimal header for the execution desk.
 * Functional, not decorative.
 */


import { PanelLeft, Settings } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';

interface ExecutionDeskHeaderProps {
  projectName: string;
  projectId: string;
  lyraVisible: boolean;
  onToggleLyra: () => void;
  onOpenSettings?: () => void;
}

export function ExecutionDeskHeader({
  projectName,
  onToggleLyra,
  onOpenSettings,
}: ExecutionDeskHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-transparent">
      {/* Left: Project name only */}
      <div className="flex items-center gap-3">
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
