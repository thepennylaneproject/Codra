/**
 * WORKSPACE LAYOUT
 * src/new/components/workspace/WorkspaceLayout.tsx
 *
 * The canonical workspace layout for Codra.
 * A chat-assisted workspace where:
 * - Conversation helps shape work (left)
 * - Work products are the primary artifact (center)
 * - Verification is visible but quiet (right, collapsed)
 *
 * Layout:
 * ┌──────────┬────────────────────────────┬──────────┐
 * │Assistant │   Workspace Surface        │  Proof   │
 * │  (240px) │   (flex-1, PRIMARY)        │  (0/320) │
 * │  subdued │   outputs as documents     │ collapsed│
 * └──────────┴────────────────────────────┴──────────┘
 */

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useFlowStore } from '../../../lib/store/useFlowStore';

// Layout constants
const ASSISTANT_COLUMN_WIDTH = 220;
const PROOF_COLUMN_WIDTH = 320;
const MIN_ASSISTANT_WIDTH = 200;
const MAX_ASSISTANT_WIDTH = 280;

interface WorkspaceLayoutProps {
  projectId: string;
  children: ReactNode;
  assistantContent: ReactNode;
  proofContent?: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  proofTrigger?: 'verification_failed' | 'conflict_detected' | 'user_opened' | null;
  proofVisible?: boolean;
  onToggleProof?: (visible: boolean) => void;
}

export function WorkspaceLayout({
  children,
  assistantContent,
  proofContent,
  headerContent,
  footerContent,
  proofTrigger = null,
  proofVisible = false,
  onToggleProof,
}: WorkspaceLayoutProps) {
  const { layout, toggleDock } = useFlowStore();

  const [isResizing, setIsResizing] = useState(false);
  const [assistantWidth, setAssistantWidth] = useState(ASSISTANT_COLUMN_WIDTH);

  // Auto-open proof panel on trigger
  useEffect(() => {
    if (proofTrigger === 'verification_failed' || proofTrigger === 'conflict_detected') {
      onToggleProof?.(true);
    }
  }, [proofTrigger, onToggleProof]);

  // Handle Assistant column resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(MIN_ASSISTANT_WIDTH, Math.min(MAX_ASSISTANT_WIDTH, e.clientX));
    setAssistantWidth(newWidth);
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
      // Cmd/Ctrl + \ : Toggle Assistant
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleDock('left');
      }
      // Cmd/Ctrl + / : Toggle Proof panel
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        onToggleProof?.(!proofVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDock, proofVisible, onToggleProof]);

  return (
    <div
      className="workspace-layout h-screen w-screen flex flex-col overflow-hidden bg-white"
    >
      {/* Header - minimal chrome */}
      {headerContent && (
        <header className="shrink-0 border-b px-8 py-4" style={{ borderBottomColor: 'rgba(26, 26, 26, 0.15)' }}>
          {headerContent}
        </header>
      )}

      {/* Main Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Assistant Column - receded */}
        {layout.leftDockVisible && (
          <aside
            className="h-full shrink-0 relative flex flex-col border-r"
            style={{ width: assistantWidth, borderRightColor: 'rgba(26, 26, 26, 0.15)', backgroundColor: '#FFFAF0' }}
          >
            <div className="flex-1 overflow-y-auto p-6">
              {assistantContent}
            </div>
            <div
              className="absolute right-0 top-0 w-px h-full cursor-col-resize"
              style={{ backgroundColor: 'rgba(26, 26, 26, 0.05)' }}
              onMouseDown={() => setIsResizing(true)}
            />
          </aside>
        )}

        {/* CENTER: Workspace Surface - PRIMARY */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>

        {/* RIGHT: Proof Panel - collapsed by default */}
        {proofVisible && proofContent && (
          <aside
            className="h-full shrink-0 border-l p-6 overflow-y-auto"
            style={{ width: PROOF_COLUMN_WIDTH, borderLeftColor: 'rgba(26, 26, 26, 0.15)', backgroundColor: '#FFFAF0' }}
          >
            {proofContent}
          </aside>
        )}
      </div>

      {/* Footer - factual status */}
      {footerContent && (
        <footer className="h-8 shrink-0 border-t border-[var(--ui-border)]/15">
          {footerContent}
        </footer>
      )}
    </div>
  );
}

export { ASSISTANT_COLUMN_WIDTH, PROOF_COLUMN_WIDTH };
