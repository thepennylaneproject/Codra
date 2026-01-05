/**
 * User Flow Analytics
 *
 * Tracks the 3 target user flows:
 * 1. Start - Create new spread/project
 * 2. Run Task - Execute task on a desk
 * 3. Export - Export output to desired format
 */

import { analytics } from '../analytics';

export type FlowType = 'start' | 'task' | 'export';

export interface FlowSession {
  flowType: FlowType;
  flowId: string;
  startTime: number;
  metadata?: Record<string, any>;
}

// Track active flow sessions
const activeSessions = new Map<string, FlowSession>();

/**
 * FLOW 1: START (Create New Spread)
 */
export function trackFlowStartBegan(projectId?: string): string {
  const flowId = crypto.randomUUID();

  activeSessions.set(flowId, {
    flowType: 'start',
    flowId,
    startTime: Date.now(),
    metadata: { projectId }
  });

  analytics.track('flow_start_began', {
    flowId,
    projectId,
    timestamp: Date.now()
  });

  return flowId;
}

export function trackFlowStartCompleted(flowId: string, projectId: string, spreadId?: string): void {
  const session = activeSessions.get(flowId);
  if (!session) return;

  const durationMs = Date.now() - session.startTime;

  analytics.track('flow_start_completed', {
    flowId,
    projectId,
    spreadId,
    durationMs,
    timestamp: Date.now()
  });

  activeSessions.delete(flowId);
}

/**
 * FLOW 2: RUN TASK (Launch and Execute Task)
 */
export function trackFlowTaskBegan(taskId: string, deskId: string, projectId?: string): string {
  const flowId = crypto.randomUUID();

  activeSessions.set(flowId, {
    flowType: 'task',
    flowId,
    startTime: Date.now(),
    metadata: { taskId, deskId, projectId }
  });

  analytics.track('flow_task_began', {
    flowId,
    taskId,
    deskId,
    projectId,
    timestamp: Date.now()
  });

  return flowId;
}

export function trackFlowTaskCompleted(
  flowId: string,
  taskId: string,
  success: boolean,
  outputCount?: number
): void {
  const session = activeSessions.get(flowId);
  if (!session) return;

  const durationMs = Date.now() - session.startTime;

  analytics.track('flow_task_completed', {
    flowId,
    taskId,
    deskId: session.metadata?.deskId,
    projectId: session.metadata?.projectId,
    success,
    durationMs,
    outputCount,
    timestamp: Date.now()
  });

  activeSessions.delete(flowId);
}

/**
 * FLOW 3: EXPORT (Export Output to Format)
 */
export function trackFlowExportBegan(outputId: string, format: string, deskId?: string): string {
  const flowId = crypto.randomUUID();

  activeSessions.set(flowId, {
    flowType: 'export',
    flowId,
    startTime: Date.now(),
    metadata: { outputId, format, deskId }
  });

  analytics.track('flow_export_began', {
    flowId,
    outputId,
    format,
    deskId,
    timestamp: Date.now()
  });

  return flowId;
}

export function trackFlowExportCompleted(
  flowId: string,
  outputId: string,
  success: boolean,
  fileSize?: number
): void {
  const session = activeSessions.get(flowId);
  if (!session) return;

  const durationMs = Date.now() - session.startTime;

  analytics.track('flow_export_completed', {
    flowId,
    outputId,
    format: session.metadata?.format,
    deskId: session.metadata?.deskId,
    success,
    durationMs,
    fileSize,
    timestamp: Date.now()
  });

  activeSessions.delete(flowId);
}

/**
 * Track flow abandonment (user navigates away before completing)
 */
export function trackFlowAbandoned(flowId: string, reason?: string): void {
  const session = activeSessions.get(flowId);
  if (!session) return;

  const durationMs = Date.now() - session.startTime;

  analytics.track('flow_abandoned', {
    flowId,
    flowType: session.flowType,
    durationMs,
    reason,
    metadata: session.metadata,
    timestamp: Date.now()
  });

  activeSessions.delete(flowId);
}

/**
 * Get active flow sessions (for debugging)
 */
export function getActiveFlows(): FlowSession[] {
  return Array.from(activeSessions.values());
}

/**
 * Clear all flow sessions (useful for testing or cleanup)
 */
export function clearAllFlows(): void {
  activeSessions.clear();
}
