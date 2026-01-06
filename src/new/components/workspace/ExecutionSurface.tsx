/**
 * EXECUTION SURFACE
 * src/new/components/workspace/ExecutionSurface.tsx
 *
 * The center column - PRIMARY workspace area.
 *
 * Purpose:
 * - Outputs, modules, artifacts
 * - This is THE PRODUCT
 *
 * Visual rules:
 * - Dominates width and attention
 * - Outputs render as DOCUMENTS, not messages
 * - Each output is visually bounded, self-contained, readable without chat context
 * - Clear status indicator per output (Draft, Verified, Needs review)
 *
 * Empty state communicates: "No work exists yet."
 * NOT: "Type something."
 */

import React, { ReactNode } from 'react';

interface ExecutionSurfaceProps {
  children?: ReactNode;
  isEmpty?: boolean;
}

export function ExecutionSurface({
  children,
  isEmpty = false,
}: ExecutionSurfaceProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Main output area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyWorkState />
        ) : (
          <div className="max-w-[860px] mx-auto py-16 px-10">
            <div className="space-y-12">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state - intentional, not instructional
 */
function EmptyWorkState() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-text-soft/30">
        Awaiting execution.
      </p>
    </div>
  );
}

/**
 * Output status types for visual indicators
 */
export type OutputStatus = 'draft' | 'verified' | 'needs_review';

/**
 * Get status label for display
 */
export function getOutputStatusLabel(status: OutputStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'verified':
      return 'Verified';
    case 'needs_review':
      return 'Needs review';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color for visual indicators - text only, no backgrounds
 */
export function getOutputStatusColor(status: OutputStatus): string {
  switch (status) {
    case 'draft':
      return 'text-zinc-400';
    case 'verified':
      return 'text-emerald-600/70';
    case 'needs_review':
      return 'text-amber-600/70';
    default:
      return 'text-zinc-400';
  }
}
