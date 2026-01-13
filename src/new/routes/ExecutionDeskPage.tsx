/**
 * EXECUTION DESK PAGE
 * src/new/routes/ExecutionDeskPage.tsx
 *
 * The canonical workspace page for Codra.
 * Implements the three-column execution desk layout.
 *
 * Layout:
 * ┌──────────┬────────────────────────────┬──────────┐
 * │  Lyra    │   Execution Surface        │  Proof   │
 * │  (240px) │   (flex-1, PRIMARY)        │  (0/320) │
 * │  subdued │   outputs as documents     │ collapsed│
 * └──────────┴────────────────────────────┴──────────┘
 *
 * Principles:
 * - The UI reflects how the system thinks, not how chat apps work
 * - Conversation helps shape work (left column)
 * - Work products are the primary artifact (center column)
 * - Verification is visible but quiet (right column, collapsed)
 * - Cost and lock moments are explicit and rare
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Project, Spread, CodraEscalation } from '../../domain/types';
import { getProjectById } from '../../domain/projects';
import { generateSpreadFromProfile } from '../../domain/spread/engine';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { LyraProvider } from '../../lib/lyra';
import { TaskExecutor, ExecutionMode } from '../../lib/ai/execution/task-executor';
import { TaskQueue, SpreadTask } from '../../domain/task-queue';
import { generateTaskQueue, updateTaskStatus } from '../../domain/spread/task-queue-engine';
import { generatePromptForTask, buildPromptContext } from '../../lib/lyra/LyraPromptEngine';
import { getBudgetSummary } from '../../lib/codra/codra-guardrails';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { useAuth } from '../../hooks/useAuth';
import { selectModelForTask } from '../../domain/model-selector';
import { behaviorTracker } from '../../lib/smart-defaults/inference-engine';
import { supabase } from '../../lib/supabase';
import { useToast } from '../components/Toast';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { useContextRevisions } from '@/hooks/useContextRevisions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { analytics } from '@/lib/analytics';

// Workspace Components
import {
  ExecutionDesk,
  LyraConversationColumn,
  ExecutionSurface,
  ProofPanel,
  OutputDocument,
  ExecutionDeskHeader,
  ExecutionDeskFooter,
  TaskQueuePanel,
} from '../components/workspace';

// Existing components for reuse
import { CodraEscalationModal } from '../components/CodraEscalation';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { ContextModal } from '@/components/context/ContextModal';
import { SpreadSection } from '../components/SpreadSection';
import { SpreadGenerationErrorBanner } from '../components/SpreadGenerationErrorBanner';
import { ConflictDialog } from '../../components/ConflictDialog';

// Types
import type { OutputStatus, VerificationResult } from '../components/workspace';

export function ExecutionDeskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const toast = useToast();
  const { user } = useAuth();

  // Store state
  const {
    layout,
    toggleDock,
    activeSectionId,
    setActiveSection,
    addToSessionCost,
    sessionCost,
  } = useFlowStore();

  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [spread, setSpread] = useState<Spread | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedOnboardingProfile | null>(null);
  const [taskQueue, setTaskQueue] = useState<TaskQueue | null>(null);
  const [activeTaskId] = useState<string | null>(null);
  const [escalations, setEscalations] = useState<CodraEscalation[]>([]);

  // Execution state
  const [taskExecutor] = useState(() => new TaskExecutor());
  const [taskRunStates, setTaskRunStates] = useState<Record<string, 'running' | 'complete' | 'failed'>>({});
  const [deskModels] = useState<Record<string, { modelId: string; providerId: string }>>({});
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);

  // User preferences for timeout
  const { preferences } = useUserPreferences();

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isProofVisible, setIsProofVisible] = useState(false);
  const [proofTrigger, setProofTrigger] = useState<'verification_failed' | 'conflict_detected' | 'user_opened' | null>(null);

  // Spread generation error state
  const [spreadError, setSpreadError] = useState<string | null>(null);
  const [isRetryingSpread, setIsRetryingSpread] = useState(false);

  // Data persistence
  const {
    spread: dbSpread,
    taskQueue: dbTaskQueue,
    loading: dbLoading,
    saveSpread: persistSpread,
    saveTaskQueue: persistTaskQueue,
    conflict,
    setConflict,
    resolveConflict,
    version: currentVersion,
  } = useSupabaseSpread(projectId);

  const budgetSummary = project?.budgetPolicy ? getBudgetSummary(project.id, project.budgetPolicy) : null;
  const { currentRevision } = useContextRevisions(projectId);

  // Initialize from database
  useEffect(() => {
    if (dbSpread) {
      setSpread(dbSpread);
      if (!activeSectionId && dbSpread.sections.length > 0) {
        setActiveSection(dbSpread.sections[0].id);
      }
    }
  }, [dbSpread, activeSectionId, setActiveSection]);

  useEffect(() => {
    if (dbTaskQueue) {
      setTaskQueue(dbTaskQueue);
      // Auto-open if we have pending tasks
      const hasPending = dbTaskQueue.tasks.some(t => t.status === 'pending');
      if (hasPending) {
        setIsProofVisible(true);
      }
    }
  }, [dbTaskQueue]);

  // Real-time subscription for other people's updates
  useEffect(() => {
    if (!projectId || !spread?.id) return;

    const subscription = supabase
      .channel('spread-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'spreads',
          filter: `id=eq.${spread.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.version !== currentVersion && updated.last_modified_by !== user?.id) {
             toast.info("Teammate updated this project. Changes are available.");
             analytics.track('spread_updated_by_other_user', {
               projectId,
               spreadId: spread.id,
               newVersion: updated.version,
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId, spread?.id, currentVersion, toast]);

  // Load project
  useEffect(() => {
    if (!projectId) return;

    getProjectById(projectId).then((p) => {
      if (p) setProject(p);
    });

    const profileStr = localStorage.getItem(`codra:onboardingProfile:${projectId}`);
    if (profileStr) {
      try {
        setExtendedProfile(JSON.parse(profileStr));
      } catch {
        console.warn('Failed to parse extended profile');
      }
    }
  }, [projectId]);

  // Generate task queue if none exists
  useEffect(() => {
    if (!project || !projectId || taskQueue || dbLoading) return;
    const newQueue = generateTaskQueue(project, extendedProfile || null, 1);
    setTaskQueue(newQueue);
    persistTaskQueue(newQueue);
  }, [project, projectId, extendedProfile, taskQueue, dbLoading, persistTaskQueue]);

  // Create fallback spread when generation fails
  const createFallbackSpread = useCallback((proj: Project): Spread => {
    const now = new Date().toISOString();
    return {
      id: `fallback-${proj.id}`,
      projectId: proj.id,
      sections: [],
      toc: [],
      version: 1,
      lastModifiedBy: '',
      lastModifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  // Generate spread if none exists
  useEffect(() => {
    if (!project || spread || dbLoading) return;
    try {
      const newSpread = generateSpreadFromProfile(project, extendedProfile || null, []);
      setSpread(newSpread);
      setSpreadError(null);
      persistSpread(newSpread);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Spread generation failed:', error);
      setSpreadError(errorMessage);
      
      // Track error in analytics
      analytics.track('spread_generation_error', {
        projectId,
        errorMessage,
        function: 'generateSpreadFromProfile',
      });
      
      // Set fallback spread so page doesn't show blank
      setSpread(createFallbackSpread(project));
    }
  }, [project, spread, dbLoading, extendedProfile, persistSpread, projectId, createFallbackSpread]);

  // Retry spread generation
  const handleRetrySpreadGeneration = useCallback(async () => {
    if (!project) return;
    setIsRetryingSpread(true);
    
    // Small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const newSpread = generateSpreadFromProfile(project, extendedProfile || null, []);
      setSpread(newSpread);
      setSpreadError(null);
      persistSpread(newSpread);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Spread generation retry failed:', error);
      setSpreadError(errorMessage);
      
      analytics.track('spread_generation_error', {
        projectId,
        errorMessage,
        function: 'generateSpreadFromProfile',
        isRetry: true,
      });
    } finally {
      setIsRetryingSpread(false);
    }
  }, [project, extendedProfile, persistSpread, projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsContextModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active task
  const activeTask = activeTaskId ? taskQueue?.tasks.find((t) => t.id === activeTaskId) || null : null;

  // Handle section update
  const handleSectionUpdate = useCallback(
    async (sectionId: string, content: Record<string, unknown>) => {
      if (!spread) return;
      const updatedSpread = {
        ...spread,
        sections: spread.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
        updatedAt: new Date().toISOString(),
      };
      setSpread(updatedSpread);
      await persistSpread(updatedSpread);
    },
    [spread, persistSpread]
  );

  // Handle task execution
  const handleRunTask = useCallback(
    async (taskId: string, mode: ExecutionMode) => {
      // Single-flight guard: prevent concurrent executions
      if (executingTaskId) {
        toast.info('A task is already running. Please wait.');
        return;
      }
      if (!taskQueue || !spread || !project) return;

      const task = taskQueue.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const validation = taskExecutor.validateTask(task);
      if (!validation.valid) {
        toast.error(`Task validation failed: ${validation.error || 'Unknown error'}`);
        return;
      }

      // Start execution tracking
      const startedAt = performance.now();
      const startedAtMs = Date.now();
      setExecutingTaskId(taskId);
      setTaskRunStates((prev) => ({ ...prev, [taskId]: 'running' }));

      // Set up timeout and countdown
      const timeoutMinutes = preferences.taskTimeoutMinutes ?? 30;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      setTimeRemaining(timeoutMinutes * 60);

      // Timeout timer
      timeoutRef.current = setTimeout(() => {
        // Clear countdown
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }

        // Update task status to timed-out
        if (taskQueue) {
          const timedOutQueue = updateTaskStatus(taskQueue, taskId, 'timed-out');
          setTaskQueue(timedOutQueue);
          persistTaskQueue(timedOutQueue);
        }

        setExecutingTaskId(null);
        setTimeRemaining(null);
        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));

        toast.error(`Task timed out after ${timeoutMinutes} minutes. Retry?`, 8000);

        analytics.track('task_timeout', {
          taskId,
          projectId,
          timeoutMinutes,
          durationMs: Date.now() - startedAtMs,
        });
      }, timeoutMs);

      // Countdown timer (updates every second)
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAtMs;
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setTimeRemaining(remaining);
      }, 1000);

      // Dynamic model selection
      const deskOverride = deskModels[task.deskId];
      let effectiveModelId: string;
      let effectiveProviderId: string;
      let smartRouting;

      if (deskOverride) {
        effectiveModelId = deskOverride.modelId;
        effectiveProviderId = deskOverride.providerId;
        smartRouting = { modelId: effectiveModelId, providerId: effectiveProviderId, reason: 'Manual Desk Override', isAutoRouted: false };
      } else {
        const smartMatch = selectModelForTask(task.deskId, task.title);
        effectiveModelId = smartMatch.modelId;
        effectiveProviderId = smartMatch.providerId;
        smartRouting = { modelId: effectiveModelId, providerId: effectiveProviderId, reason: smartMatch.reason, isAutoRouted: true };
      }

      // Analytics: task started
      analytics.track('flow_task_began', {
        taskId,
        taskType: task.deskId,
        deskId: task.deskId,
        spreadId: spread.id,
        modelId: effectiveModelId,
        providerId: effectiveProviderId,
      });

      // Track behavior for reruns
      if (mode === 'execute' && task.status === 'complete') {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) {
            behaviorTracker.track({
              userId: session.user.id,
              timestamp: new Date(),
              event: 'task_rerun',
              metadata: { taskId, taskTitle: task.title, deskId: task.deskId, projectId: project.id },
            });
          }
        } catch (err) {
          console.error('Failed to track task rerun:', err);
        }
      }

      let updatedQueue = updateTaskStatus(taskQueue, taskId, 'in-progress');
      // Also store startedAt
      updatedQueue = {
        ...updatedQueue,
        tasks: updatedQueue.tasks.map((t: SpreadTask) =>
          t.id === taskId ? { ...t, startedAt: startedAtMs } : t
        ),
      };
      setTaskQueue(updatedQueue);
      if (mode === 'execute') persistTaskQueue(updatedQueue);

      try {
        const promptContext = buildPromptContext(
          spread,
          extendedProfile || null,
          activeSectionId || undefined,
          taskQueue.tasks,
          activeTask || undefined
        );

        const promptResult = generatePromptForTask(task, promptContext);

        const result = await taskExecutor.executeTask({
          task,
          prompt: promptResult.prompt,
          context: promptContext,
          modelId: effectiveModelId,
          providerId: effectiveProviderId,
          mode,
        });

        updatedQueue = updateTaskStatus(taskQueue, taskId, 'complete');
        const finalTasks = updatedQueue.tasks.map((t: SpreadTask) =>
          t.id === taskId
            ? {
                ...t,
                memory: result.memory,
                output: result.output,
                actualCost: result.cost,
                tokensUsed: result.tokensUsed,
                modelUsed: result.modelUsed,
                smartRouting,
                completedAt: new Date().toISOString(),
              }
            : t
        );
        updatedQueue = { ...updatedQueue, tasks: finalTasks };
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        if (mode === 'execute') addToSessionCost(result.cost);

        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'complete' }));

        // Analytics: task completed
        analytics.track('flow_task_completed', {
          taskId,
          taskType: task.deskId,
          deskId: task.deskId,
          modelUsed: result.modelUsed,
          cost: result.cost,
          durationMs: Math.round(performance.now() - startedAt),
        });

        toast.success(`${mode === 'preview' ? 'Preview' : 'Execution'} complete • ${result.tokensUsed} tokens`);
      } catch (error) {
        console.error('[AI Task Execution Failed]', error);
        updatedQueue = updateTaskStatus(taskQueue, taskId, 'pending');
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));
        setProofTrigger('verification_failed');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Analytics: task failed
        analytics.track('flow_task_failed', {
          taskId,
          taskType: task.deskId,
          deskId: task.deskId,
          error: errorMessage.slice(0, 100),
          durationMs: Math.round(performance.now() - startedAt),
        });

        toast.error(`Execution failed: ${errorMessage}`, 8000);
      } finally {
        // Clear timers
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setTimeRemaining(null);
        setExecutingTaskId(null);
      }
    },
    [
      taskQueue,
      spread,
      project,
      extendedProfile,
      activeSectionId,
      taskExecutor,
      deskModels,
      persistTaskQueue,
      addToSessionCost,
      toast,
      activeTask,
      executingTaskId,
      preferences.taskTimeoutMinutes,
      projectId,
    ]
  );

  // Handle task cancellation
  const handleCancelTask = useCallback(async (taskId: string) => {
    if (!executingTaskId || executingTaskId !== taskId) {
      return;
    }

    const startTime = taskQueue?.tasks.find(t => t.id === taskId)?.startedAt || Date.now();

    try {
      // Call backend cancel endpoint
      const response = await fetch('/.netlify/functions/task-cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, taskId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel task');
      }

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      // Update task status
      const cancelledAt = Date.now();
      if (taskQueue) {
        const updatedQueue = updateTaskStatus(taskQueue, taskId, 'cancelled');
        const finalTasks = updatedQueue.tasks.map((t: SpreadTask) =>
          t.id === taskId ? { ...t, cancelledAt } : t
        );
        const finalQueue = { ...updatedQueue, tasks: finalTasks };
        setTaskQueue(finalQueue);
        persistTaskQueue(finalQueue);
      }

      setExecutingTaskId(null);
      setTimeRemaining(null);
      setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));

      toast.info('Task cancelled');

      // Analytics
      analytics.track('task_cancelled', {
        taskId,
        projectId,
        durationMs: cancelledAt - startTime,
      });
    } catch (error) {
      console.error('Failed to cancel task:', error);
      toast.error('Failed to cancel task');
    }
  }, [executingTaskId, projectId, taskQueue, persistTaskQueue, toast]);


  // Handle escalation resolution
  const handleResolveEscalation = (id: string, confirmed: boolean) => {
    if (confirmed) {
      setEscalations((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
    } else {
      setEscalations((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // Computed values
  const hasOutputs = Boolean(taskQueue?.tasks.some((task) => task.status === 'complete' || Boolean(task.output)));
  const contextSummary = currentRevision?.summary?.trim() || '';
  const blockingEscalation = escalations.find((e) => e.severity === 'blocking' && !e.resolved);

  // Proof panel data (from completed tasks)
  const verificationResults: VerificationResult[] = useMemo(() => {
    if (!taskQueue) return [];
    return taskQueue.tasks
      .filter((t) => t.status === 'complete')
      .map((t) => ({
        id: t.id,
        status: 'passed' as const,
        message: t.title,
        details: t.output ? 'Output generated' : undefined,
      }));
  }, [taskQueue]);

  // Map spread section status to OutputStatus
  const mapSectionStatus = (status: string): OutputStatus => {
    switch (status) {
      case 'ready':
      case 'locked':
        return 'verified';
      case 'draft':
        return 'draft';
      default:
        return 'needs_review';
    }
  };

  if (!project) {
    return (
      <div className="h-screen bg-[var(--color-ivory)] text-text-primary/40 flex items-center justify-center font-mono text-xs">
        Loading workspace...
      </div>
    );
  }

  return (
    <ErrorBoundary name="Execution Desk">
      <LyraProvider>
        {/* Blocking Escalation Modal */}
        {blockingEscalation && (
          <CodraEscalationModal
            escalation={blockingEscalation}
            onConfirm={() => handleResolveEscalation(blockingEscalation.id, true)}
            onCancel={() => handleResolveEscalation(blockingEscalation.id, false)}
          />
        )}

        <ExecutionDesk
          projectId={projectId || ''}
          proofTrigger={proofTrigger}
          proofVisible={isProofVisible}
          onToggleProof={(visible) => setIsProofVisible(visible)}
          headerContent={
            <ExecutionDeskHeader
              projectName={project.name}
              projectId={projectId || ''}
              lyraVisible={layout.leftDockVisible}
              onToggleLyra={() => toggleDock('left')}
              onToggleProof={() => setIsProofVisible(!isProofVisible)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          }
          footerContent={
            <ExecutionDeskFooter
              completedTasks={taskQueue?.tasks.filter((t) => t.status === 'complete').length || 0}
              totalTasks={taskQueue?.tasks.length || 0}
              sessionCost={sessionCost}
            />
          }
          lyraContent={
            <div data-tour="lyra-assistant">
              <LyraConversationColumn
                spreadId={spread?.id}
                deskId={activeTask?.deskId}
                contextSummary={contextSummary}
                onEditContext={() => setIsContextModalOpen(true)}
              />
            </div>
          }
          proofContent={
            <div className="flex flex-col h-full">
              <div data-tour="task-queue">
                <TaskQueuePanel
                  tasks={taskQueue?.tasks || []}
                  executingTaskId={executingTaskId}
                  taskRunStates={taskRunStates}
                  onRunTask={handleRunTask}
                  onCancelTask={handleCancelTask}
                  canExecute={!executingTaskId}
                  timeRemaining={timeRemaining}
                />
              </div>
              <div className="border-t border-[var(--ui-border)]/15">
                <ProofPanel
                  verificationResults={verificationResults}
                  conflicts={[]}
                  synthesisNotes={[]}
                  onClose={() => {
                    setProofTrigger(null);
                    setIsProofVisible(false);
                  }}
                />
              </div>
            </div>
          }
        >
          {/* CENTER: Execution Surface - PRIMARY */}
          <ExecutionSurface
            isEmpty={!hasOutputs && !spreadError}
          >
            {/* Error Banner for spread generation failures */}
            {spreadError && (
              <SpreadGenerationErrorBanner
                errorMessage={spreadError}
                onRetry={handleRetrySpreadGeneration}
                isRetrying={isRetryingSpread}
              />
            )}

            {/* Outputs as documents */}
            {spread?.sections.map((section) => (
              <OutputDocument
                key={section.id}
                id={section.id}
                title={section.title}
                status={mapSectionStatus(section.status)}
                source={section.source.replace('_', ' ')}
                isActive={section.id === activeSectionId}
              >
                <SpreadSection
                  section={section}
                  isActive={section.id === activeSectionId}
                  onUpdate={handleSectionUpdate}
                />
              </OutputDocument>
            ))}
          </ExecutionSurface>
        </ExecutionDesk>

        {/* Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          projectId={projectId || undefined}
          taskId={activeTaskId || undefined}
          defaultScope={activeTaskId ? 'task' : 'project'}
          sessionSpend={sessionCost}
          todaySpend={budgetSummary?.spent}
        />

        <ContextModal isOpen={isContextModalOpen} onClose={() => setIsContextModalOpen(false)} projectId={projectId || undefined} />

        <ConflictDialog
          conflict={conflict}
          onMerge={() => resolveConflict('merge', projectId || '', spread?.id || '', spread!)}
          onUseMine={() => resolveConflict('mine', projectId || '', spread?.id || '', spread!)}
          onUseTheirs={() => resolveConflict('theirs', projectId || '', spread?.id || '', spread!)}
          onClose={() => setConflict(null)}
        />
      </LyraProvider>
    </ErrorBoundary>
  );
}
