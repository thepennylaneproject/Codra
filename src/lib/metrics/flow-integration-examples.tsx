/**
 * Flow Analytics Integration Examples
 *
 * Examples showing how to integrate the 3 main user flow tracking
 * into Codra components.
 */

import { useEffect, useState } from 'react';
import {
  trackFlowStartBegan,
  trackFlowStartCompleted,
  trackFlowTaskBegan,
  trackFlowTaskCompleted,
  trackFlowExportBegan,
  trackFlowExportCompleted
} from '../../../lib/metrics/flow-analytics';

/**
 * EXAMPLE 1: Track "Start" Flow (Create New Spread)
 *
 * Use in: OnboardingFlow.tsx or NewProjectOnboarding.tsx
 */
export const CreateSpreadWithFlowTracking = () => {
  const [flowId, setFlowId] = useState<string | null>(null);

  const handleStartCreation = () => {
    // Track flow start
    const id = trackFlowStartBegan();
    setFlowId(id);
  };

  const handleSpreadCreated = (projectId: string, spreadId: string) => {
    if (flowId) {
      // Track flow completion
      trackFlowStartCompleted(flowId, projectId, spreadId);
    }
  };

  // Usage in component:
  useEffect(() => {
    handleStartCreation();
  }, []);

  return null;
};

/**
 * EXAMPLE 2: Track "Task" Flow (Run Task on Desk)
 *
 * Use in: TaskLaunchPanel.tsx or DeskCanvas components
 */
export const RunTaskWithFlowTracking = () => {
  const [flowId, setFlowId] = useState<string | null>(null);

  const handleLaunchTask = (taskId: string, deskId: string, projectId: string) => {
    // Track flow start
    const id = trackFlowTaskBegan(taskId, deskId, projectId);
    setFlowId(id);

    // ... launch task logic
  };

  const handleTaskCompleted = (taskId: string, success: boolean, outputs?: number) => {
    if (flowId) {
      // Track flow completion
      trackFlowTaskCompleted(flowId, taskId, success, outputs);
    }
  };

  return null;
};

/**
 * EXAMPLE 3: Track "Export" Flow (Export Output)
 *
 * Use in: ExportPanel.tsx or export-related components
 */
export const ExportOutputWithFlowTracking = () => {
  const [flowId, setFlowId] = useState<string | null>(null);

  const handleStartExport = (outputId: string, format: string, deskId?: string) => {
    // Track flow start
    const id = trackFlowExportBegan(outputId, format, deskId);
    setFlowId(id);

    // ... export logic
  };

  const handleExportCompleted = (outputId: string, success: boolean, fileSize?: number) => {
    if (flowId) {
      // Track flow completion
      trackFlowExportCompleted(flowId, outputId, success, fileSize);
    }
  };

  return null;
};

/**
 * INTEGRATION LOCATIONS:
 *
 * Flow 1: Start
 * - File: src/new/routes/onboarding/OnboardingFlow.tsx
 * - Track: When user begins onboarding → when spread is created
 *
 * Flow 2: Run Task
 * - File: src/new/components/panels/TaskLaunchPanel.tsx
 * - Track: When task is launched → when task completes
 *
 * Flow 3: Export
 * - File: src/new/components/panels/ExportPanel.tsx (if exists)
 * - Track: When export starts → when file is downloaded
 *
 * IMPORTANT: Store flowId in component state to connect start/complete events
 */
