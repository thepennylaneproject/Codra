/**
 * PROOF PANEL
 * src/new/components/workspace/ProofPanel.tsx
 *
 * The right column for verification and synthesis.
 *
 * Purpose:
 * - Verification results
 * - Conflict detection
 * - Synthesis notes
 *
 * Behavior:
 * - COLLAPSED by default
 * - Opens ONLY when:
 *   - Verification fails
 *   - Conflict is detected
 *   - User explicitly opens it
 *
 * Visual rules:
 * - No narration
 * - No verbosity
 * - Quiet, informational only
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export type VerificationStatus = 'passed' | 'failed' | 'warning' | 'pending';

export interface VerificationResult {
  id: string;
  status: VerificationStatus;
  message: string;
  details?: string;
  timestamp?: Date;
}

export interface Conflict {
  id: string;
  source: string;
  target: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SynthesisNote {
  id: string;
  content: string;
  source?: string;
}

interface ProofPanelProps {
  verificationResults?: VerificationResult[];
  conflicts?: Conflict[];
  synthesisNotes?: SynthesisNote[];
  onClose?: () => void;
}

export function ProofPanel({
  verificationResults = [],
  conflicts = [],
  synthesisNotes = [],
  onClose,
}: ProofPanelProps) {
  const hasVerificationIssues = verificationResults.some(
    (v) => v.status === 'failed' || v.status === 'warning'
  );
  const hasConflicts = conflicts.length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-[var(--ui-border)]/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-text-soft uppercase tracking-wider">
            Verification
          </span>
          {hasVerificationIssues && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
          {hasConflicts && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 rounded text-text-soft hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {/* Content - Minimal, no narration */}
      <div className="flex-1 overflow-y-auto">
        {/* Verification Results */}
        {verificationResults.length > 0 && (
          <section className="p-4 border-b border-[var(--ui-border)]/20">
            <h3 className="text-[9px] uppercase tracking-wider text-text-soft/50 mb-3">
              Results
            </h3>
            <div className="space-y-2">
              {verificationResults.map((result) => (
                <VerificationItem key={result.id} result={result} />
              ))}
            </div>
          </section>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <section className="p-4 border-b border-[var(--ui-border)]/20">
            <h3 className="text-[9px] uppercase tracking-wider text-text-soft/50 mb-3">
              Conflicts
            </h3>
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <ConflictItem key={conflict.id} conflict={conflict} />
              ))}
            </div>
          </section>
        )}

        {/* Synthesis Notes */}
        {synthesisNotes.length > 0 && (
          <section className="p-4">
            <h3 className="text-[9px] uppercase tracking-wider text-text-soft/50 mb-3">
              Synthesis
            </h3>
            <div className="space-y-2">
              {synthesisNotes.map((note) => (
                <SynthesisItem key={note.id} note={note} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {verificationResults.length === 0 && conflicts.length === 0 && synthesisNotes.length === 0 && (
          <div className="p-4 text-center text-xs text-text-soft/60">
            No verification data.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual verification result - minimal display
 */
function VerificationItem({ result }: { result: VerificationResult }) {
  const StatusIcon = getStatusIcon(result.status);
  const statusColor = getStatusColor(result.status);

  return (
    <div className="flex items-start gap-2 text-[12px]">
      <StatusIcon size={14} className={statusColor} />
      <div className="flex-1 min-w-0">
        <p className="text-text-primary truncate">{result.message}</p>
        {result.details && (
          <p className="text-text-soft/60 text-[11px] mt-0.5 truncate">
            {result.details}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Individual conflict item - minimal display
 */
function ConflictItem({ conflict }: { conflict: Conflict }) {
  const severityColor = {
    low: 'text-zinc-400',
    medium: 'text-amber-500',
    high: 'text-red-500',
  }[conflict.severity];

  return (
    <div className="flex items-start gap-2 text-[12px]">
      <AlertTriangle size={14} className={severityColor} />
      <div className="flex-1 min-w-0">
        <p className="text-text-primary truncate">{conflict.description}</p>
        <p className="text-text-soft/60 text-[11px] mt-0.5">
          {conflict.source} → {conflict.target}
        </p>
      </div>
    </div>
  );
}

/**
 * Individual synthesis note - minimal display
 */
function SynthesisItem({ note }: { note: SynthesisNote }) {
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <Info size={14} className="text-zinc-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-text-soft leading-relaxed">{note.content}</p>
        {note.source && (
          <p className="text-text-soft/40 text-[10px] mt-1">
            Source: {note.source}
          </p>
        )}
      </div>
    </div>
  );
}

function getStatusIcon(status: VerificationStatus) {
  switch (status) {
    case 'passed':
      return CheckCircle2;
    case 'failed':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return Info;
  }
}

function getStatusColor(status: VerificationStatus): string {
  switch (status) {
    case 'passed':
      return 'text-emerald-500';
    case 'failed':
      return 'text-red-500';
    case 'warning':
      return 'text-amber-500';
    default:
      return 'text-zinc-400';
  }
}
