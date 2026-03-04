export type AsyncOperationStatus = 'idle' | 'running' | 'success' | 'error';

export interface AsyncOperationState {
  status: AsyncOperationStatus;
  operationId: string | null;
  phase?: string;
  progress?: number;
  error?: string | null;
}
