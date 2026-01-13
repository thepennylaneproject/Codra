/**
 * WORKSPACE COMPONENTS
 * src/new/components/workspace/index.ts
 *
 * Exports for the canonical workspace layout.
 *
 * Architecture:
 * - ExecutionDesk: Main three-column layout shell
 * - LyraConversationColumn: Left column for conversational planning
 * - ExecutionSurface: Center column for outputs (PRIMARY)
 * - ProofPanel: Right column for verification (collapsed by default)
 * - OutputDocument: Document wrapper for outputs
 */

export { ExecutionDesk, LYRA_COLUMN_WIDTH, PROOF_COLUMN_WIDTH } from './ExecutionDesk';
export { LyraConversationColumn } from './LyraConversationColumn';
export { ExecutionSurface, getOutputStatusLabel, getOutputStatusColor } from './ExecutionSurface';
export type { OutputStatus } from './ExecutionSurface';
export { ProofPanel } from './ProofPanel';
export type { VerificationResult, VerificationStatus, Conflict, SynthesisNote } from './ProofPanel';
export { OutputDocument, OutputDocumentGroup, OutputDocumentSkeleton } from './OutputDocument';
export { ExecutionDeskHeader } from './ExecutionDeskHeader';
export { ExecutionDeskFooter } from './ExecutionDeskFooter';
export { TaskQueuePanel } from './TaskQueuePanel';
