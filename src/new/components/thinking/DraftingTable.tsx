/**
 * Drafting Table
 *
 * The central surface where thought fragments accumulate.
 * Documents placed on a table, not tasks in a list.
 *
 * You start talking. Typing. Dumping fragments.
 * You are not punished for this mess.
 */

import { useCallback, useRef } from 'react';
import { FragmentCard } from './FragmentCard';
import { FragmentInput } from './FragmentInput';
import { useThinkingStore } from '../../../lib/store/thinking-store';
import { normalizeFragment } from '../../../lib/thinking/fragment-normalizer';

export function DraftingTable() {
  const {
    fragments,
    shadowProject,
    addFragment,
    updateFragmentStrength,
    incrementMentionCount,
    linkFragments,
  } = useThinkingStore();

  const surfaceRef = useRef<HTMLDivElement>(null);

  const handleNewFragment = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      // Normalize the fragment against existing ones
      const result = normalizeFragment(content, fragments);

      // If this is essentially a repetition, upgrade the existing fragment
      if (result.isRepetition && result.upgradeTarget) {
        incrementMentionCount(result.upgradeTarget.fragmentId);
        updateFragmentStrength(
          result.upgradeTarget.fragmentId,
          result.upgradeTarget.newStrength
        );
        return; // Don't add duplicate
      }

      // If similar fragments exist but not exact match, still upgrade them
      if (result.upgradeTarget) {
        incrementMentionCount(result.upgradeTarget.fragmentId);
        updateFragmentStrength(
          result.upgradeTarget.fragmentId,
          result.upgradeTarget.newStrength
        );
      }

      // Add the new fragment
      const fragment = addFragment(content, result.classification.type);

      // Link to similar fragments
      for (const similar of result.similarFragments) {
        linkFragments(fragment.id, similar.id);
      }
    },
    [fragments, addFragment, updateFragmentStrength, incrementMentionCount, linkFragments]
  );

  // Calculate readiness indicator
  const readinessScore = shadowProject?.readinessScore ?? 0;
  const readinessLabel =
    readinessScore < 0.3
      ? 'Gathering thoughts...'
      : readinessScore < 0.6
      ? 'Patterns emerging...'
      : readinessScore < 0.8
      ? 'Shape forming...'
      : 'Ready for structure';

  return (
    <div className="drafting-table">
      {/* Surface hint (only when empty) */}
      {fragments.length === 0 && (
        <div className="drafting-table__hint">
          <p className="drafting-table__hint-text">
            Type anything. Change your mind. Contradict yourself.
          </p>
          <p className="drafting-table__hint-subtext">
            This is how work begins.
          </p>
        </div>
      )}

      {/* Fragment canvas */}
      <div className="drafting-table__canvas" ref={surfaceRef}>
        {fragments.map((fragment, index) => (
          <FragmentCard
            key={fragment.id}
            fragment={fragment}
            style={{
              // Slight stagger for visual interest
              animationDelay: `${index * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Input area */}
      <div className="drafting-table__input-area">
        <FragmentInput onSubmit={handleNewFragment} />

        {/* Subtle readiness indicator (only after some fragments) */}
        {fragments.length >= 3 && (
          <div className="drafting-table__readiness">
            <div
              className="drafting-table__readiness-bar"
              style={{ width: `${readinessScore * 100}%` }}
            />
            <span className="drafting-table__readiness-label">
              {readinessLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = `
.drafting-table {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--surface-pasteboard);
  padding: var(--space-8);
}

.drafting-table__hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.drafting-table__hint-text {
  font-family: var(--font-reading);
  font-size: var(--text-lg);
  font-style: italic;
  color: var(--ink-ghost);
  margin-bottom: var(--space-2);
}

.drafting-table__hint-subtext {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--ink-placeholder);
}

.drafting-table__canvas {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-content: flex-start;
  padding-bottom: var(--space-16);
  position: relative;
}

.drafting-table__input-area {
  position: sticky;
  bottom: 0;
  background: var(--surface-pasteboard);
  padding-top: var(--space-4);
  border-top: var(--border-width) var(--border-style) var(--chrome-border-subtle);
  margin-top: auto;
}

.drafting-table__readiness {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.drafting-table__readiness-bar {
  height: 2px;
  background: var(--state-thinking);
  border-radius: 1px;
  transition: width var(--duration-slow) var(--ease-out);
  max-width: 120px;
}

.drafting-table__readiness-label {
  font-size: var(--text-xs);
  color: var(--ink-ghost);
  font-style: italic;
}

/* Fragment appear animation */
@keyframes fragment-appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
