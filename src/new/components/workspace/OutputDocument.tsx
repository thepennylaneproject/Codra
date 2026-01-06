/**
 * OUTPUT DOCUMENT
 * src/new/components/workspace/OutputDocument.tsx
 *
 * The primary output wrapper component.
 * Outputs render as DOCUMENTS, not messages.
 *
 * Each output is:
 * - Visually bounded
 * - Self-contained
 * - Readable without chat context
 *
 * Status indicators:
 * - Draft
 * - Verified
 * - Needs review
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { OutputStatus, getOutputStatusLabel, getOutputStatusColor } from './ExecutionSurface';

interface OutputDocumentProps {
  id: string;
  title: string;
  status: OutputStatus;
  children: ReactNode;
  source?: string;
  timestamp?: Date;
  metadata?: Record<string, string>;
  isActive?: boolean;
}

export function OutputDocument({
  id,
  title,
  status,
  children,
  source,
  timestamp,
  metadata,
  isActive = false,
}: OutputDocumentProps) {
  const StatusIcon = getStatusIcon(status);
  const statusLabel = getOutputStatusLabel(status);
  const statusColorClass = getOutputStatusColor(status);

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      id={`output-${id}`}
      className={`
        output-document
        ${isActive ? 'border-l-2 border-l-zinc-300 pl-6' : 'pl-8'}
      `}
    >
      {/* Document Header - minimal */}
      <header className="mb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-medium text-text-primary">
              {title}
            </h2>
            {source && (
              <p className="text-[10px] text-text-soft/40 mt-1 uppercase tracking-wider">
                {source}
              </p>
            )}
          </div>
          <span className={`text-[10px] ${statusColorClass}`}>
            {statusLabel}
          </span>
        </div>
      </header>

      {/* Document Body */}
      <div className="prose prose-sm max-w-none text-text-primary leading-relaxed">
        {children}
      </div>

      {/* Document Footer - only if metadata present */}
      {(timestamp || metadata) && (
        <footer className="mt-6 pt-4 border-t border-[var(--ui-border)]/15">
          <div className="flex items-center justify-between text-[10px] text-text-soft/40">
            {timestamp && (
              <span className="tabular-nums">
                {timestamp.toLocaleDateString()}
              </span>
            )}
            {metadata && (
              <div className="flex items-center gap-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <span key={key} className="tabular-nums">{value}</span>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </motion.article>
  );
}

/**
 * Output Document Group - For grouping related outputs
 */
interface OutputDocumentGroupProps {
  title: string;
  children: ReactNode;
  count?: number;
}

export function OutputDocumentGroup({
  title,
  children,
  count,
}: OutputDocumentGroupProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-semibold text-text-soft uppercase tracking-wider">
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-[10px] text-text-soft/50">
            ({count})
          </span>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}

/**
 * Output Skeleton - Loading state
 */
export function OutputDocumentSkeleton() {
  return (
    <div className="pl-8 opacity-40">
      <div className="h-4 bg-zinc-200 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-zinc-100 rounded w-full" />
        <div className="h-3 bg-zinc-100 rounded w-4/5" />
        <div className="h-3 bg-zinc-100 rounded w-3/5" />
      </div>
    </div>
  );
}

function getStatusIcon(status: OutputStatus) {
  switch (status) {
    case 'verified':
      return CheckCircle2;
    case 'needs_review':
      return AlertCircle;
    case 'draft':
    default:
      return Clock;
  }
}
