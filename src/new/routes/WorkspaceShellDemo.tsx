/**
 * WORKSPACE SHELL DEMO PAGE
 * Demonstrates the new workspace shell architecture with all features
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { WorkspaceShell } from '../../components/workspace';
import { Sparkles, FileText, Lightbulb, Terminal } from 'lucide-react';

export const WorkspaceShellDemo: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  // Demo content for left dock
  const leftDockContent = (
    <div className="h-full p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--shell-text-primary)' }}>
          Table of Contents
        </h3>
        <div className="space-y-2">
          {['Introduction', 'Objectives', 'Constraints', 'Requirements'].map((item, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[var(--shell-surface-2)] transition-colors"
              style={{ color: 'var(--shell-text-secondary)' }}
            >
              <FileText size={12} className="inline mr-2" />
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--shell-text-primary)' }}>
          AI Tasks
        </h3>
        <div className="space-y-2">
          {['Generate Copy', 'Design Assets', 'Code Review'].map((task, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{
                backgroundColor: 'var(--shell-surface-2)',
                borderColor: 'var(--shell-border)',
                color: 'var(--shell-text-secondary)',
              }}
            >
              <Terminal size={12} className="inline mr-2" />
              {task}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Demo content for right dock
  const rightDockContent = (
    <div className="h-full p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--shell-text-primary)' }}>
          Lyra Suggestions
        </h3>
        <div className="space-y-3">
          {[
            'Consider adding visual hierarchy',
            'Clarify target audience',
            'Review brand consistency',
          ].map((suggestion, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border-l-2"
              style={{
                backgroundColor: 'var(--shell-surface-2)',
                borderLeftColor: 'var(--brand-teal)',
                color: 'var(--shell-text-secondary)',
              }}
            >
              <Lightbulb size={12} className="inline mr-2" />
              <span className="text-xs">{suggestion}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--shell-text-primary)' }}>
          Output Inspector
        </h3>
        <div
          className="p-4 rounded-lg border font-mono text-xs"
          style={{
            backgroundColor: 'var(--shell-surface-0)',
            borderColor: 'var(--shell-border)',
            color: 'var(--shell-text-secondary)',
          }}
        >
          No active output
        </div>
      </div>
    </div>
  );

  // Demo canvas content
  const canvasContent = (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <Sparkles size={48} className="text-[var(--brand-teal)] mx-auto animate-pulse" />
        <h1
          className="text-4xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Workspace Shell Demo
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Try the following features:
        </p>
        <ul className="text-xs space-y-2 text-left" style={{ color: 'var(--text-soft)' }}>
          <li>• <kbd className="px-2 py-1 bg-white/5 rounded">Cmd/Ctrl + \</kbd> - Toggle left dock</li>
          <li>• <kbd className="px-2 py-1 bg-white/5 rounded">Cmd/Ctrl + /</kbd> - Toggle right dock</li>
          <li>• Drag the dividers to resize panels</li>
          <li>• Double-click dividers to collapse/expand</li>
          <li>• Toggle docks using the header buttons</li>
          <li>• Reload the page - your layout persists!</li>
        </ul>
      </div>
    </div>
  );

  return (
    <WorkspaceShell
      projectId={projectId || 'demo-project'}
      projectName="Workspace Shell Demo"
      leftDockContent={leftDockContent}
      rightDockContent={rightDockContent}
      headerMode="canvas"
      progress={{ current: 3, total: 10 }}
      budget={{ used: 2.50, total: 50.00 }}
      alerts={[
        { type: 'info', message: 'Layout state persisted' },
      ]}
    >
      {canvasContent}
    </WorkspaceShell>
  );
};
