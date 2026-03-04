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
          Proof
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
          <section className="space-y-3 mb-4">
            <div className="text-[9px] text-text-soft/40 uppercase tracking-widest">
              Verification Results
            </div>
            <ul className="space-y-2">
              {verificationResults.map((result) => (
                <VerificationItem key={result.id} result={result} />
              ))}
            </ul>
          </section>
        )}

        {conflicts.length > 0 && (
          <section className="space-y-2 mb-4 pt-4 border-t border-[var(--ui-border)]/15">
            <div className="text-[9px] text-text-soft/40 uppercase tracking-widest">
              Conflicts
            </div>
            <ul className="space-y-2">
              {conflicts.map((conflict) => (
                <ConflictItem key={conflict.id} conflict={conflict} />
              ))}
            </ul>
          </section>
        )}

        {synthesisNotes.length > 0 && (
          <section className="space-y-2 pt-4 border-t border-[var(--ui-border)]/15">
            <div className="text-[9px] text-text-soft/40 uppercase tracking-widest">
              Notes
            </div>
            <ul className="space-y-2">
              {synthesisNotes.map((note) => (
                <SynthesisItem key={note.id} note={note} />
              ))}
            </ul>
          </section>
        )}

        {verificationResults.length === 0 && conflicts.length === 0 && synthesisNotes.length === 0 && (
          <div className="space-y-2">
            <div className="text-[9px] text-text-soft/40 uppercase tracking-widest">
              What verification means
            </div>
            <p className="text-[11px] text-text-soft/60 leading-relaxed">
              Proof tracks whether task outputs meet their required checks, sources, and constraints.
              When a task completes, its verification status and notes appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationItem({ result }: { result: VerificationResult }) {
  return (
    <li className="border border-[var(--ui-border)]/20 rounded-md px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-text-soft/70">
          {getStatusLabel(result.status)}
        </span>
        {result.timestamp && (
          <span className="text-[9px] text-text-soft/40">
            {result.timestamp.toLocaleTimeString()}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-text-soft/70">
        {result.message}
      </p>
      {result.details && (
        <p className="mt-1 text-[11px] text-text-soft/50">
          {result.details}
        </p>
      )}
    </li>
  );
}

function ConflictItem({ conflict }: { conflict: Conflict }) {
  return (
    <li className="border border-[var(--ui-border)]/20 rounded-md px-2 py-2 text-[11px]">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-text-soft/70">
        Conflict
      </div>
      <p className="mt-1 text-text-soft/70">
        {conflict.description}
      </p>
    </li>
  );
}

function SynthesisItem({ note }: { note: SynthesisNote }) {
  return (
    <li className="text-[11px] text-text-soft/50 leading-relaxed">
      {note.content}
    </li>
  );
}



function getStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Failed';
    case 'warning':
      return 'Warning';
    default:
      return 'Pending';
  }
}
