/**
 * EXECUTION DESK HEADER
 * src/new/components/workspace/ExecutionDeskHeader.tsx
 *
 * Minimal header for the execution desk.
 * Functional, not decorative.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PanelLeft, Settings } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';

interface ExecutionDeskHeaderProps {
  projectName: string;
  projectId: string;
  lyraVisible: boolean;
  onToggleLyra: () => void;
  onOpenSettings?: () => void;
  statusLabel?: string;
}

export function ExecutionDeskHeader({
  projectName,
  projectId,
  lyraVisible,
  onToggleLyra,
  onOpenSettings,
  statusLabel,
}: ExecutionDeskHeaderProps) {
  return (
    <header className="h-full flex items-center justify-between px-6 bg-transparent">
      {/* Left: Project name only */}
      <div className="flex items-center gap-3">
        <Link to="/projects" className="text-text-soft/40 hover:text-text-soft transition-colors">
          <span className="text-[10px] tracking-wide">←</span>
        </Link>
        <h1 className="text-[13px] font-normal text-text-primary/70">{projectName}</h1>
        {statusLabel && (
          <span className="text-[10px] text-text-soft/40">
            {statusLabel}
          </span>
        )}
      </div>

      {/* Right: Actions - subdued */}
      <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleLyra}
          title="Toggle Lyra (Cmd+\)"
          aria-label="Toggle Lyra panel"
          className="text-text-soft/60 hover:text-text-soft"
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
            className="text-text-soft/60 hover:text-text-soft"
          >
            <Settings size={14} />
          </IconButton>
        )}
      </div>
    </header>
  );
}
