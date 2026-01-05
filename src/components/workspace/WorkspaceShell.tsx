/**
 * WORKSPACE SHELL
 * Main layout container for Codra workspace
 * 
 * Layout Structure:
 * ┌─────────────────────────────────────────────┐
 * │  Header (48px)                              │
 * ├────────┬────────────────────┬───────────────┤
 * │  Left  │  Center Canvas     │  Right        │
 * │  Dock  │  (flex-1)          │  Dock         │
 * │  ↔     │                    │  ↔            │
 * ├────────┴────────────────────┴───────────────┤
 * │  Activity Strip (40px)                      │
 * └─────────────────────────────────────────────┘
 */

import React, { useEffect } from 'react';
import { useWorkspaceLayout } from '../../hooks/useWorkspaceLayout';
import { PanelDock } from './PanelDock';
import { ActivityStrip } from './ActivityStrip';
import { WorkspaceHeader } from '../../new/components/shell/WorkspaceHeader';
import { Text } from '../../new/components';

interface WorkspaceShellProps {
  projectId: string;
  projectName: string;
  children: React.ReactNode;
  leftDockContent?: React.ReactNode;
  rightDockContent?: React.ReactNode;
  headerMode?: 'canvas' | 'studio';
  activeStudioId?: string;
  contextMemory?: {
    percentage: number;
    level: 'low' | 'medium' | 'high' | 'critical';
  };
  progress?: {
    current: number;
    total: number;
  };
  budget?: {
    used: number;
    total: number;
  };
  alerts?: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  projectId,
  projectName,
  children,
  leftDockContent,
  rightDockContent,
  headerMode = 'canvas',
  activeStudioId,
  contextMemory,
  progress,
  budget,
  alerts,
}) => {
  const {
    leftDockVisible,
    rightDockVisible,
    leftDockWidth,
    rightDockWidth,
    toggleLeftDock,
    toggleRightDock,
    setLeftDockWidth,
    setRightDockWidth,
  } = useWorkspaceLayout(projectId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + \ : Toggle left dock
        if (e.key === '\\') {
          e.preventDefault();
          toggleLeftDock();
        }
        // Cmd/Ctrl + / : Toggle right dock
        if (e.key === '/') {
          e.preventDefault();
          toggleRightDock();
        }
        // Cmd/Ctrl + 1-4 : Switch desk view (placeholder for future)
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          console.log(`Desk switch shortcut: ${e.key} (not yet implemented)`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftDock, toggleRightDock]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--shell-surface-0)' }}
    >
      {/* Header Bar - Fixed 48px */}
      <WorkspaceHeader
        projectName={projectName}
        projectId={projectId}
        leftDockVisible={leftDockVisible}
        rightDockVisible={rightDockVisible}
        onToggleLeftDock={toggleLeftDock}
        onToggleRightDock={toggleRightDock}
        contextMemory={contextMemory}
        mode={headerMode}
        activeStudioId={activeStudioId as any}
      />

      {/* Main Content Area - Flex row */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Dock */}
        <PanelDock
          side="left"
          isVisible={leftDockVisible}
          width={leftDockWidth}
          onWidthChange={setLeftDockWidth}
          onToggle={toggleLeftDock}
        >
          {leftDockContent || <PlaceholderDock title="Left Dock" items={['TOC', 'AI Tasks']} />}
        </PanelDock>

        {/* Center Canvas - Always visible */}
        <div
          className="flex-1 overflow-auto"
          style={{ backgroundColor: 'var(--bg-default)' }}
        >
          {children}
        </div>

        {/* Right Dock */}
        <PanelDock
          side="right"
          isVisible={rightDockVisible}
          width={rightDockWidth}
          onWidthChange={setRightDockWidth}
          onToggle={toggleRightDock}
        >
          {rightDockContent || (
            <PlaceholderDock title="Right Dock" items={['Lyra module', 'Output Inspector']} />
          )}
        </PanelDock>
      </div>

      {/* Activity Strip - Fixed 40px */}
      <ActivityStrip progress={progress} budget={budget} alerts={alerts} />
    </div>
  );
};

/**
 * Placeholder dock content for development
 */
const PlaceholderDock: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  return (
    <div className="h-full p-6 flex flex-col gap-4">
      <Text as="h2" size="xs" className="text-shell-text-primary">
        {title}
      </Text>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-xl border border-[var(--shell-border)] bg-[var(--shell-surface-2)] text-shell-text-secondary"
          >
            <Text size="xs" className="font-medium">{item} (placeholder)</Text>
          </div>
        ))}
      </div>
    </div>
  );
};
