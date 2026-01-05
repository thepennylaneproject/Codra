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
    <header className="h-full flex items-center justify-between px-6 bg-[var(--ui-bg)]/80 border-b border-[var(--ui-border)]">
      {/* Left: Brand & Project */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="flex items-center gap-2 group">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:scale-125 transition-transform" />
          <span className="font-semibold tracking-tighter text-xs">Codra</span>
        </Link>

        <div className="h-4 w-px bg-[var(--ui-border)]" />

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium text-text-primary">{projectName}</h1>
          {statusLabel && (
            <span className="text-xs text-text-soft px-2 py-0.5 bg-zinc-100 rounded-full">
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <IconButton
          variant={lyraVisible ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleLyra}
          title="Toggle Lyra (Cmd+\)"
          aria-label="Toggle Lyra panel"
          className="text-text-soft hover:text-text-primary"
        >
          <PanelLeft size={16} />
        </IconButton>

        {onOpenSettings && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            title="Settings (Cmd+,)"
            aria-label="Open settings"
            className="text-text-soft hover:text-text-primary"
          >
            <Settings size={16} />
          </IconButton>
        )}
      </div>
    </header>
  );
}
