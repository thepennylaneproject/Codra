/**
 * WORKSPACE COMPONENTS
 * src/new/components/workspace/index.ts
 *
 * Exports for the canonical workspace layout.
 *
 * Architecture:
 * - WorkspaceLayout: Main three-column layout shell
 * - AssistantColumn: Left column for conversational planning
 * - WorkspaceSurface: Center column for outputs (PRIMARY)
 * - ProofPanel: Right column for verification (collapsed by default)
 * - OutputDocument: Document wrapper for outputs
 */

export { WorkspaceLayout, ASSISTANT_COLUMN_WIDTH, PROOF_COLUMN_WIDTH } from './WorkspaceLayout';
export { AssistantColumn } from './AssistantColumn';
export { WorkspaceSurface, getOutputStatusLabel, getOutputStatusColor } from './WorkspaceSurface';
export type { OutputStatus } from './WorkspaceSurface';
export { ProofPanel } from './ProofPanel';
export type { VerificationResult, VerificationStatus, Conflict, SynthesisNote } from './ProofPanel';
export { CostLedgerPanel } from './CostLedgerPanel';
export { OutputDocument, OutputDocumentGroup, OutputDocumentSkeleton } from './OutputDocument';
export { WorkspaceHeader } from './WorkspaceHeader';
export { CostDisplay } from './CostDisplay';
export { WorkspaceFooter } from './WorkspaceFooter';
export { RetrievalSourcesPanel } from './RetrievalSourcesPanel';
export { AuthenticityPanel } from './AuthenticityPanel';
export { TaskQueuePanel } from './TaskQueuePanel';
