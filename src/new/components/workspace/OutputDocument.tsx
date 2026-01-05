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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      id={`output-${id}`}
      className={`
        output-document
        bg-white
        border border-[var(--ui-border)]/60
        rounded-xl
        overflow-hidden
        shadow-sm
        ${isActive ? 'ring-2 ring-zinc-200' : ''}
      `}
    >
      {/* Document Header */}
      <header className="px-6 py-4 border-b border-[var(--ui-border)]/40 bg-zinc-50/50">
        <div className="flex items-start justify-between gap-4">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-text-primary truncate">
              {title}
            </h2>
            {source && (
              <p className="text-[11px] text-text-soft/60 mt-0.5 uppercase tracking-wider">
                {source}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColorClass}`}>
            <StatusIcon size={12} />
            <span>{statusLabel}</span>
          </div>
        </div>
      </header>

      {/* Document Body - The actual content */}
      <div className="px-6 py-5">
        <div className="prose prose-sm max-w-none text-text-primary">
          {children}
        </div>
      </div>

      {/* Document Footer - Minimal metadata */}
      {(timestamp || metadata) && (
        <footer className="px-6 py-3 border-t border-[var(--ui-border)]/20 bg-zinc-50/30">
          <div className="flex items-center justify-between text-[10px] text-text-soft/60">
            {timestamp && (
              <span>
                {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {metadata && (
              <div className="flex items-center gap-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <span key={key}>
                    <span className="uppercase tracking-wider">{key}:</span> {value}
                  </span>
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
    <div className="bg-white border border-[var(--ui-border)]/40 rounded-xl overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-[var(--ui-border)]/20 bg-zinc-50/50">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-zinc-200 rounded w-1/3" />
          <div className="h-5 bg-zinc-200 rounded w-16" />
        </div>
      </div>
      <div className="px-6 py-5 space-y-3">
        <div className="h-4 bg-zinc-100 rounded w-full" />
        <div className="h-4 bg-zinc-100 rounded w-4/5" />
        <div className="h-4 bg-zinc-100 rounded w-3/5" />
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
