/**
 * EXECUTION DESK
 * src/new/components/workspace/ExecutionDesk.tsx
 *
 * The canonical workspace layout for Codra.
 * A chat-assisted execution desk where:
 * - Conversation helps shape work (left)
 * - Work products are the primary artifact (center)
 * - Verification is visible but quiet (right, collapsed)
 *
 * Layout:
 * ┌──────────┬────────────────────────────┬──────────┐
 * │  Lyra    │   Execution Surface        │  Proof   │
 * │  (240px) │   (flex-1, PRIMARY)        │  (0/320) │
 * │  subdued │   outputs as documents     │ collapsed│
 * └──────────┴────────────────────────────┴──────────┘
 */

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { useFlowStore } from '../../../lib/store/useFlowStore';

// Layout constants
const LYRA_COLUMN_WIDTH = 240;
const PROOF_COLUMN_WIDTH = 320;
const MIN_LYRA_WIDTH = 200;
const MAX_LYRA_WIDTH = 320;

interface ExecutionDeskProps {
  projectId: string;
  children: ReactNode;
  lyraContent: ReactNode;
  proofContent?: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  proofTrigger?: 'verification_failed' | 'conflict_detected' | 'user_opened' | null;
}

export function ExecutionDesk({
  projectId,
  children,
  lyraContent,
  proofContent,
  headerContent,
  footerContent,
  proofTrigger = null,
}: ExecutionDeskProps) {
  const { layout, updateLayout, toggleDock } = useFlowStore();

  // Proof panel only opens on exceptions or explicit user action
  const [proofVisible, setProofVisible] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lyraWidth, setLyraWidth] = useState(LYRA_COLUMN_WIDTH);

  // Auto-open proof panel on trigger
  useEffect(() => {
    if (proofTrigger === 'verification_failed' || proofTrigger === 'conflict_detected') {
      setProofVisible(true);
    }
  }, [proofTrigger]);

  // Handle Lyra column resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(MIN_LYRA_WIDTH, Math.min(MAX_LYRA_WIDTH, e.clientX));
    setLyraWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + \ : Toggle Lyra
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleDock('left');
      }
      // Cmd/Ctrl + / : Toggle Proof panel
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setProofVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDock]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--shell-surface-0)' }}
    >
      {/* Header - Minimal, functional */}
      {headerContent && (
        <header className="h-12 shrink-0 border-b border-[var(--shell-border)]">
          {headerContent}
        </header>
      )}

      {/* Main Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Lyra Column - Narrow, Subdued */}
        {layout.leftDockVisible && (
          <aside
            className="h-full shrink-0 relative flex flex-col border-r border-[var(--ui-border)]/50"
            style={{
              width: lyraWidth,
              backgroundColor: 'var(--color-ivory)',
              opacity: 0.95,
            }}
          >
            {/* Lyra content - subdued, smaller typography */}
            <div className="flex-1 overflow-y-auto lyra-column">
              {lyraContent}
            </div>

            {/* Resize handle */}
            <div
              className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-zinc-300/40 transition-colors z-10"
              onMouseDown={() => setIsResizing(true)}
            />
          </aside>
        )}

        {/* CENTER: Execution Surface - PRIMARY */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--bg-default)' }}
        >
          <div className="flex-1 overflow-y-auto execution-surface">
            {children}
          </div>
        </main>

        {/* RIGHT: Proof Panel - Collapsed by default */}
        {proofVisible && proofContent && (
          <aside
            className="h-full shrink-0 border-l border-[var(--ui-border)]/50 bg-white"
            style={{ width: PROOF_COLUMN_WIDTH }}
          >
            <div className="h-full flex flex-col">
              {/* Proof header with close */}
              <div className="h-10 px-4 flex items-center justify-between border-b border-[var(--ui-border)]/40">
                <span className="text-[10px] font-semibold text-text-soft uppercase tracking-wider">
                  Verification
                </span>
                <button
                  onClick={() => setProofVisible(false)}
                  className="p-1 hover:bg-zinc-100 rounded text-text-soft hover:text-text-primary transition-colors"
                  aria-label="Close proof panel"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              </div>

              {/* Proof content - minimal, no narration */}
              <div className="flex-1 overflow-y-auto proof-panel">
                {proofContent}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer - Activity/status, minimal */}
      {footerContent && (
        <footer className="h-10 shrink-0 border-t border-[var(--shell-border)]">
          {footerContent}
        </footer>
      )}

      {/* Inline styles for visual hierarchy */}
      <style>{`
        /* Lyra column: subdued, collaborative feel */
        .lyra-column {
          font-size: 13px;
          color: var(--text-soft);
        }
        .lyra-column h1, .lyra-column h2, .lyra-column h3 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-soft);
        }

        /* Execution surface: primary, document-focused */
        .execution-surface {
          font-size: 15px;
        }

        /* Proof panel: quiet, minimal */
        .proof-panel {
          font-size: 12px;
          color: var(--text-soft);
        }
      `}</style>
    </div>
  );
}

export { LYRA_COLUMN_WIDTH, PROOF_COLUMN_WIDTH };
