/**
 * Status Bar
 *
 * InDesign-style status bar at the bottom.
 * Quiet metrics. Always visible. Never demanding.
 *
 * Shows: fragment count, phase, cost (when applicable), thinking state.
 */

import React from 'react';
import { useThinkingStore } from '../../../lib/store/thinking-store';

export function StatusBar() {
  const {
    currentPhase,
    fragments,
    shadowProject,
    totalActualCost,
    totalEstimatedCost,
    debateInProgress,
    documents,
    verifications,
  } = useThinkingStore();

  const phaseLabel = getPhaseLabel(currentPhase);
  const verifiedCount = documents.filter((d) => d.state === 'verified').length;
  const attentionCount = documents.filter((d) => d.state === 'attention').length;

  return (
    <div className="status-bar">
      {/* Phase indicator */}
      <div className="status-bar__section">
        <span
          className={`status-bar__indicator ${
            debateInProgress ? 'status-bar__indicator--thinking' : ''
          }`}
        />
        <span className="status-bar__label">{phaseLabel}</span>
      </div>

      <div className="status-bar__divider" />

      {/* Fragment count */}
      <div className="status-bar__section">
        <span className="status-bar__value">{fragments.length}</span>
        <span className="status-bar__label">
          {fragments.length === 1 ? 'fragment' : 'fragments'}
        </span>
      </div>

      {/* Core beliefs count (after enough fragments) */}
      {shadowProject && shadowProject.coreBeliefs.length > 0 && (
        <>
          <div className="status-bar__divider" />
          <div className="status-bar__section">
            <span className="status-bar__value">
              {shadowProject.coreBeliefs.length}
            </span>
            <span className="status-bar__label">core</span>
          </div>
        </>
      )}

      {/* Documents (during/after execution) */}
      {documents.length > 0 && (
        <>
          <div className="status-bar__divider" />
          <div className="status-bar__section">
            <span className="status-bar__value">{documents.length}</span>
            <span className="status-bar__label">documents</span>
          </div>

          {verifiedCount > 0 && (
            <div className="status-bar__section">
              <span className="status-bar__indicator status-bar__indicator--verified" />
              <span className="status-bar__value">{verifiedCount}</span>
              <span className="status-bar__label">verified</span>
            </div>
          )}

          {attentionCount > 0 && (
            <div className="status-bar__section">
              <span className="status-bar__indicator status-bar__indicator--attention" />
              <span className="status-bar__value">{attentionCount}</span>
              <span className="status-bar__label">attention</span>
            </div>
          )}
        </>
      )}

      {/* Cost (right-aligned, only when tracking) */}
      {(totalActualCost > 0 || totalEstimatedCost) && (
        <div className="status-bar__section status-bar__section--cost">
          <span className="status-bar__label">Cost:</span>
          <span className="status-bar__value status-bar__value--mono">
            ${totalActualCost.toFixed(2)}
          </span>
          {totalEstimatedCost && (
            <span className="status-bar__estimate">
              / ${totalEstimatedCost.expected.toFixed(2)} est.
            </span>
          )}
        </div>
      )}

      {/* No commitment state (arrival phase) */}
      {currentPhase === 'arrival' && fragments.length > 0 && (
        <div className="status-bar__section status-bar__section--right">
          <span className="status-bar__note">No commitment yet</span>
        </div>
      )}
    </div>
  );
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    arrival: 'Arrival',
    reflection: 'Reflection',
    debate: 'Thinking',
    proposal: 'Proposal',
    consent: 'Cost Review',
    execution: 'Execution',
    verification: 'Verification',
    complete: 'Complete',
  };
  return labels[phase] ?? phase;
}

// Styles
const styles = `
.status-bar__value {
  font-weight: 500;
  color: var(--chrome-text);
  margin-right: var(--space-1);
}

.status-bar__value--mono {
  font-family: var(--font-mono);
}

.status-bar__label {
  color: var(--chrome-text-muted);
}

.status-bar__estimate {
  color: var(--chrome-text-muted);
  margin-left: var(--space-1);
}

.status-bar__section--cost {
  margin-left: auto;
}

.status-bar__section--right {
  margin-left: auto;
}

.status-bar__note {
  font-style: italic;
  color: var(--chrome-text-muted);
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
