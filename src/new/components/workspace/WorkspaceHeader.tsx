/**
/**
 * WORKSPACE HEADER
 * src/new/components/workspace/WorkspaceHeader.tsx
 *
 * Minimal header for the workspace.
 * Functional, not decorative.
 */


import { PanelLeft, PanelRight, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { IconButton } from '@/components/ui/Button';
import { CostDisplay } from './CostDisplay';

interface WorkspaceHeaderProps {
  projectName: string;
  projectId: string;
  assistantVisible: boolean;
  onToggleAssistant: () => void;
  onToggleProof: () => void;
  onOpenSettings?: () => void;
  costSummary?: {
    estimated: number;
    spent: number;
    remaining: number;
    status: 'ok' | 'warning' | 'exceeded';
  };
}

export function WorkspaceHeader({
  projectName,
  projectId,
  onToggleAssistant,
  onToggleProof,
  onOpenSettings,
  costSummary,
}: WorkspaceHeaderProps) {
  const location = useLocation();
  const isDesk = location.pathname.includes('/workspace');
  const isContext = location.pathname.includes('/context');
  const isArchive = location.pathname.includes('/production');

  return (
    <header className="flex items-center justify-between bg-transparent">
      {/* Left: Environment + Project name */}
      <div className="flex flex-col gap-1">
        <p className="font-normal text-[#1A1A1A]" style={{ fontSize: '11px', opacity: 0.6 }}>
          Workspace
        </p>
        <h1 className="font-normal text-[#1A1A1A]" style={{ fontSize: '14px' }}>{projectName}</h1>
        <div className="flex items-center gap-4">
          <Link
            to={`/p/${projectId}/workspace`}
            className={`text-[10px] uppercase tracking-[0.2em] border-b-2 ${
              isDesk ? 'text-[#1A1A1A] border-[#1A1A1A]' : 'text-[#1A1A1A]/50 border-transparent hover:text-[#1A1A1A]'
            }`}
          >
            Work
          </Link>
          <Link
            to={`/p/${projectId}/context`}
            className={`text-[10px] uppercase tracking-[0.2em] border-b-2 ${
              isContext ? 'text-[#1A1A1A] border-[#1A1A1A]' : 'text-[#1A1A1A]/50 border-transparent hover:text-[#1A1A1A]'
            }`}
          >
            Context
          </Link>
          <Link
            to={`/p/${projectId}/production`}
            className={`text-[10px] uppercase tracking-[0.2em] border-b-2 ${
              isArchive ? 'text-[#1A1A1A] border-[#1A1A1A]' : 'text-[#1A1A1A]/50 border-transparent hover:text-[#1A1A1A]'
            }`}
          >
            Archive
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {costSummary && (
          <CostDisplay
            estimated={costSummary.estimated}
            spent={costSummary.spent}
            remaining={costSummary.remaining}
            status={costSummary.status}
          />
        )}

        {/* Right: Actions - subdued */}
        <div className="flex items-center gap-1" style={{ opacity: '0.4' }}>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleAssistant}
          title="Toggle Assistant (Cmd+\)"
          aria-label="Toggle Assistant panel"
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
      </div>
    </header>
  );
}
