/**
 * Lyra Presence
 *
 * Lyra does not ask onboarding questions.
 * Lyra behaves like you arguing with yourself, but smarter.
 *
 * She interrupts only when necessary.
 * Not: "Please define your goals."
 * But: "You're talking about trust more than features. Is that intentional?"
 *
 * You feel seen, not guided.
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useThinkingStore } from '../../../lib/store/thinking-store';
import {
  generateReflection,
  selectObservationsToSurface,
} from '../../../lib/thinking/lyra-pattern-detector';
import type { LyraObservation } from '../../../lib/thinking/types';

export function LyraPresence() {
  const {
    lyraMode,
    observations,
    interventions,
    surfaceObservation,
    addIntervention,
    markInterventionDelivered,
  } = useThinkingStore();

  // Get observations ready to surface
  const observationsToSurface = useMemo(
    () => selectObservationsToSurface(observations),
    [observations]
  );

  // Get pending interventions (reflections not yet delivered)
  const pendingInterventions = useMemo(
    () => interventions.filter((i) => !i.deliveredAt),
    [interventions]
  );

  // When an observation should be shown, generate a reflection
  const handleSurfaceObservation = useCallback(
    (observation: LyraObservation) => {
      surfaceObservation(observation.id);
      const reflection = generateReflection(observation);
      addIntervention(reflection);
      markInterventionDelivered(reflection.id);
    },
    [surfaceObservation, addIntervention, markInterventionDelivered]
  );

  // Auto-surface observations when ready
  useEffect(() => {
    if (
      lyraMode === 'reflecting' &&
      observationsToSurface.length > 0 &&
      pendingInterventions.length === 0
    ) {
      // Surface the top observation
      handleSurfaceObservation(observationsToSurface[0]);
    }
  }, [lyraMode, observationsToSurface, pendingInterventions.length, handleSurfaceObservation]);

  // Get delivered reflections to show
  const deliveredReflections = useMemo(
    () =>
      interventions
        .filter((i) => i.deliveredAt)
        .sort((a, b) =>
          (b.deliveredAt?.getTime() ?? 0) - (a.deliveredAt?.getTime() ?? 0)
        )
        .slice(0, 5), // Show last 5
    [interventions]
  );

  return (
    <div className="lyra-presence chrome-panel">
      <div className="chrome-panel__header">
        Lyra
      </div>

      <div className="chrome-panel__content">
        {/* Mode indicator */}
        <div className="lyra-mode-indicator">
          <span className={`lyra-mode-indicator__dot lyra-mode-indicator__dot--${lyraMode}`} />
          <span className="lyra-mode-indicator__label">{getModeLabel(lyraMode)}</span>
        </div>

        {/* Reflections */}
        <div className="lyra-reflections">
          {lyraMode === 'dormant' && (
            <p className="lyra-dormant-text">
              Waiting for you to begin.
            </p>
          )}

          {lyraMode === 'observing' && deliveredReflections.length === 0 && (
            <p className="lyra-observing-text">
              Listening. Patterns will emerge.
            </p>
          )}

          {deliveredReflections.map((intervention) => (
            <div key={intervention.id} className="lyra-reflection">
              <p className="lyra-reflection__statement">
                {intervention.statement}
              </p>
              {intervention.requiresResponse && (
                <p className="lyra-reflection__implicit">
                  {intervention.implicitQuestion}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Shadow project summary (when available) */}
        <ShadowSummary />
      </div>
    </div>
  );
}

/**
 * Shadow Summary - shows what Codra is understanding (but not intrusively)
 */
function ShadowSummary() {
  const { shadowProject, fragments } = useThinkingStore();

  if (!shadowProject || fragments.length < 5) {
    return null;
  }

  const { coreBeliefs, constraints, anxieties, readinessScore } = shadowProject;

  // Only show if we have meaningful content
  if (coreBeliefs.length === 0 && constraints.length === 0 && anxieties.length === 0) {
    return null;
  }

  return (
    <div className="shadow-summary">
      <div className="shadow-summary__divider" />

      <h4 className="shadow-summary__title">Understanding so far</h4>

      {coreBeliefs.length > 0 && (
        <div className="shadow-summary__section">
          <span className="shadow-summary__label">Core beliefs:</span>
          <span className="shadow-summary__count">{coreBeliefs.length}</span>
        </div>
      )}

      {constraints.length > 0 && (
        <div className="shadow-summary__section">
          <span className="shadow-summary__label">Constraints:</span>
          <span className="shadow-summary__count">{constraints.length}</span>
        </div>
      )}

      {anxieties.length > 0 && (
        <div className="shadow-summary__section">
          <span className="shadow-summary__label">Concerns:</span>
          <span className="shadow-summary__count">{anxieties.length}</span>
        </div>
      )}

      <div className="shadow-summary__readiness">
        <span className="shadow-summary__label">Readiness:</span>
        <span className="shadow-summary__score">
          {Math.round(readinessScore * 100)}%
        </span>
      </div>
    </div>
  );
}

function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    dormant: 'dormant',
    observing: 'observing',
    reflecting: 'reflecting',
    present: 'present',
  };
  return labels[mode] ?? mode;
}

// Styles
const styles = `
.lyra-presence {
  height: 100%;
}

.lyra-mode-indicator__label {
  font-size: var(--text-sm);
}

.lyra-reflections {
  margin-top: var(--space-4);
}

.lyra-dormant-text,
.lyra-observing-text {
  font-family: var(--font-reading);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--chrome-text-muted);
}

.lyra-reflection {
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) var(--border-style) var(--chrome-border);
}

.lyra-reflection:last-child {
  border-bottom: none;
}

.lyra-reflection__statement {
  font-family: var(--font-reading);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--chrome-text);
  font-style: italic;
  margin-bottom: var(--space-2);
}

.lyra-reflection__implicit {
  font-size: var(--text-sm);
  color: var(--chrome-text-muted);
}

/* Shadow Summary */
.shadow-summary {
  margin-top: auto;
  padding-top: var(--space-4);
}

.shadow-summary__divider {
  height: 1px;
  background: var(--chrome-border);
  margin-bottom: var(--space-3);
}

.shadow-summary__title {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  color: var(--chrome-text-muted);
  margin-bottom: var(--space-2);
}

.shadow-summary__section {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  padding: var(--space-1) 0;
}

.shadow-summary__label {
  color: var(--chrome-text-muted);
}

.shadow-summary__count {
  color: var(--chrome-text);
  font-family: var(--font-mono);
}

.shadow-summary__readiness {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  padding: var(--space-1) 0;
  margin-top: var(--space-2);
  border-top: var(--border-width) var(--border-style) var(--chrome-border);
}

.shadow-summary__score {
  color: var(--state-thinking);
  font-family: var(--font-mono);
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
