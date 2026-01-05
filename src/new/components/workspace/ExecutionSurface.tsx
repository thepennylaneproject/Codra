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
      {/* Execution status bar - only when actively executing */}
      <AnimatePresence>
        {isExecuting && executionLabel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 px-8 py-2 bg-zinc-900 border-b border-zinc-800"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-zinc-300">
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
          <div className="max-w-[900px] mx-auto py-12 px-8">
            <div className="space-y-8">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state - "No work exists yet"
 * Deliberately NOT prompting for input
 */
function EmptyWorkState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm px-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <FileText size={24} className="text-zinc-400" />
        </div>
        <p className="text-sm text-text-soft font-medium mb-2">
          No work exists yet.
        </p>
        <p className="text-xs text-text-soft/60 leading-relaxed">
          Outputs will appear here as documents once execution begins.
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
