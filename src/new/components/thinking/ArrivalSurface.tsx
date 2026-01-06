/**
 * Arrival Surface
 *
 * When you open Codra, nothing demands action.
 * No setup wizard. No blank form screaming "name your project."
 *
 * Instead, Codra behaves like you sitting down at a table with a notebook.
 * It assumes you don't fully know what you're building yet.
 */

import React, { useEffect, useCallback } from 'react';
import { DraftingTable } from './DraftingTable';
import { LyraPresence } from './LyraPresence';
import { StatusBar } from './StatusBar';
import { useThinkingStore } from '../../../lib/store/thinking-store';
import {
  detectAllPatterns,
  updateShadowFromPatterns,
} from '../../../lib/thinking/lyra-pattern-detector';
import '../../../styles/thinking-workspace.css';

export function ArrivalSurface() {
  const {
    currentPhase,
    fragments,
    shadowProject,
    lyraMode,
    observations,
    addObservation,
    updateShadowProject,
    setLyraMode,
  } = useThinkingStore();

  // Run pattern detection when fragments change
  useEffect(() => {
    if (fragments.length >= 3) {
      // Detect patterns
      const newObservations = detectAllPatterns(fragments, shadowProject);

      // Add observations that don't already exist
      const existingIds = new Set(observations.map((o) => o.content));
      for (const obs of newObservations) {
        if (!existingIds.has(obs.content)) {
          addObservation(obs);
        }
      }

      // Update shadow project
      const shadowUpdates = updateShadowFromPatterns(
        shadowProject,
        fragments,
        [...observations, ...newObservations]
      );
      updateShadowProject(shadowUpdates);

      // Wake Lyra if dormant and we have enough signal
      if (lyraMode === 'dormant' && fragments.length >= 2) {
        setLyraMode('observing');
      }
    }
  }, [fragments.length]); // Only re-run when fragment count changes

  return (
    <div className="thinking-workspace">
      {/* Main content area */}
      <div className="thinking-workspace__main">
        {/* Lyra presence (observing sidebar) */}
        <aside className="thinking-workspace__lyra">
          <LyraPresence />
        </aside>

        {/* Drafting table (main surface) */}
        <main className="thinking-workspace__surface">
          <DraftingTable />
        </main>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

// Layout styles (inline for now, will move to CSS)
const styles = `
.thinking-workspace__main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.thinking-workspace__lyra {
  width: var(--panel-width-md);
  flex-shrink: 0;
  border-right: var(--border-width) var(--border-style) var(--chrome-border);
  background: var(--chrome-bg-elevated);
  overflow-y: auto;
}

.thinking-workspace__surface {
  flex: 1;
  overflow: auto;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
