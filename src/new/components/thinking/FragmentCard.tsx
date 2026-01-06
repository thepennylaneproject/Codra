/**
 * Fragment Card
 *
 * A single thought placed on the drafting table.
 * Like a card you'd put down while brainstorming.
 *
 * Fragments have types (statement, constraint, anxiety, etc.)
 * and strengths (passing, recurring, core).
 */

import React from 'react';
import type { ThoughtFragment } from '../../../lib/thinking/types';

interface FragmentCardProps {
  fragment: ThoughtFragment;
  style?: React.CSSProperties;
}

export function FragmentCard({ fragment, style }: FragmentCardProps) {
  const typeLabel = getTypeLabel(fragment.type);
  const strengthClass = getStrengthClass(fragment.strength);
  const typeClass = getTypeClass(fragment.type);

  return (
    <div
      className={`fragment-card ${typeClass} ${strengthClass}`}
      style={style}
    >
      <div className="fragment-card__content">
        {fragment.content}
      </div>

      <div className="fragment-card__meta">
        {fragment.strength !== 'passing' && (
          <span className="fragment-card__strength">
            {fragment.strength === 'core' ? '●●●' : '●●'}
          </span>
        )}
        {fragment.mentionCount > 1 && (
          <span className="fragment-card__mentions">
            ×{fragment.mentionCount}
          </span>
        )}
        <span className="fragment-card__type">{typeLabel}</span>
      </div>
    </div>
  );
}

function getTypeLabel(type: ThoughtFragment['type']): string {
  const labels: Record<ThoughtFragment['type'], string> = {
    statement: 'statement',
    question: 'question',
    constraint: 'constraint',
    anxiety: 'concern',
    signal: 'signal',
    aesthetic: 'aesthetic',
    'anti-pattern': 'avoid',
  };
  return labels[type];
}

function getTypeClass(type: ThoughtFragment['type']): string {
  return `fragment-card--${type}`;
}

function getStrengthClass(strength: ThoughtFragment['strength']): string {
  return `fragment-card--strength-${strength}`;
}

// Styles
const styles = `
.fragment-card {
  background: var(--surface-document);
  border: var(--border-width) var(--border-style) var(--chrome-border-subtle);
  padding: var(--space-4);
  max-width: 320px;
  min-width: 200px;
  position: relative;
  animation: fragment-appear var(--duration-normal) var(--ease-out) both;
}

.fragment-card__content {
  font-family: var(--font-reading);
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
  color: var(--ink-body);
  margin-bottom: var(--space-3);
}

.fragment-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--ink-ghost);
}

.fragment-card__strength {
  color: var(--state-thinking);
  letter-spacing: -2px;
}

.fragment-card__mentions {
  color: var(--ink-tertiary);
}

.fragment-card__type {
  margin-left: auto;
  text-transform: lowercase;
}

/* Type variants */
.fragment-card--constraint {
  border-left: 3px solid var(--state-attention);
}

.fragment-card--anxiety {
  border-left: 3px solid var(--state-conflict-subtle);
}

.fragment-card--signal,
.fragment-card--aesthetic {
  border-left: 3px solid var(--state-thinking);
}

.fragment-card--anti-pattern {
  border-left: 3px solid var(--state-conflict);
}

.fragment-card--question {
  border-left: 3px solid var(--ink-secondary);
}

/* Strength variants */
.fragment-card--strength-core {
  background: var(--surface-margin);
  border-width: 2px;
}

.fragment-card--strength-core .fragment-card__content {
  font-weight: 500;
}

.fragment-card--strength-recurring {
  background: var(--surface-document-hover);
}

/* Hover state */
.fragment-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
