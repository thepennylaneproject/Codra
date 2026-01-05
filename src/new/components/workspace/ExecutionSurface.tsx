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
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';

interface ExecutionSurfaceProps {
  children?: ReactNode;
  isEmpty?: boolean;
  isExecuting?: boolean;
  executionLabel?: string;
}

export function ExecutionSurface({
  children,
  isEmpty = false,
  isExecuting = false,
  executionLabel,
}: ExecutionSurfaceProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Execution status - minimal, factual */}
      <AnimatePresence>
        {isExecuting && executionLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="shrink-0 px-8 py-2 border-b border-[var(--ui-border)]/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-zinc-400" />
              <span className="text-[11px] text-text-soft">
                {executionLabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
 * Empty state - factual, not instructional
 */
function EmptyWorkState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-text-soft/50">
          No outputs
        </p>
      </div>
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
 * Get status color for visual indicators
 */
export function getOutputStatusColor(status: OutputStatus): string {
  switch (status) {
    case 'draft':
      return 'text-zinc-400 bg-zinc-100';
    case 'verified':
      return 'text-emerald-600 bg-emerald-50';
    case 'needs_review':
      return 'text-amber-600 bg-amber-50';
    default:
      return 'text-zinc-400 bg-zinc-100';
  }
}
