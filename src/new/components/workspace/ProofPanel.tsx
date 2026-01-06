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


  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - minimal */}
      <div className="h-8 px-4 flex items-center justify-between border-b border-[var(--ui-border)]/15 shrink-0">
        <span className="text-[9px] text-text-soft/40 uppercase tracking-widest">
          Checks
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0.5 text-text-soft/30 hover:text-text-soft transition-colors"
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {/* Content - technical appendix */}
      <div className="flex-1 overflow-y-auto p-4">
        {verificationResults.length > 0 && (
          <div className="space-y-2 mb-4">
            {verificationResults.map((result) => (
              <VerificationItem key={result.id} result={result} />
            ))}
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="space-y-2 mb-4 pt-4 border-t border-[var(--ui-border)]/15">
            {conflicts.map((conflict) => (
              <ConflictItem key={conflict.id} conflict={conflict} />
            ))}
          </div>
        )}

        {synthesisNotes.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-[var(--ui-border)]/15">
            {synthesisNotes.map((note) => (
              <SynthesisItem key={note.id} note={note} />
            ))}
          </div>
        )}

        {verificationResults.length === 0 && conflicts.length === 0 && synthesisNotes.length === 0 && (
          <p className="text-[11px] text-text-soft/30">
            No data
          </p>
        )}
      </div>
    </div>
  );
}

function VerificationItem({ result }: { result: VerificationResult }) {
  const statusColor = getStatusColor(result.status);

  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className={`w-1 h-1 mt-1.5 rounded-full shrink-0 ${statusColor.replace('text-', 'bg-')}`} />
      <p className="text-text-soft/70 truncate">{result.message}</p>
    </div>
  );
}

function ConflictItem({ conflict }: { conflict: Conflict }) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="w-1 h-1 mt-1.5 rounded-full shrink-0 bg-amber-400" />
      <p className="text-text-soft/70 truncate">{conflict.description}</p>
    </div>
  );
}

function SynthesisItem({ note }: { note: SynthesisNote }) {
  return (
    <p className="text-[11px] text-text-soft/50 leading-relaxed">
      {note.content}
    </p>
  );
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
