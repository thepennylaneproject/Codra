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
import { Project, ProjectSpecification, CodraEscalation } from '../../domain/types';
import { getProjectById } from '../../domain/projects';
import { generateSpecificationFromProfile } from '../../domain/specification/engine';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { AssistantProvider } from '../../lib/assistant';
import { TaskExecutor, ExecutionMode } from '../../lib/ai/execution/task-executor';
import { TaskQueue, SpecificationTask } from '../../domain/task-queue';
import { generateTaskQueue, updateTaskStatus } from '../../domain/specification/task-queue-engine';
import { generatePromptForTask, buildPromptContext } from '../../lib/assistant/AssistantPromptEngine';
import { checkGuardrails, createEscalation, getBudgetSummary, shouldEscalate } from '../../lib/codra/codra-guardrails';
import { useSpecification } from '../../hooks/useSpecification';
import { useAuth } from '../../hooks/useAuth';
import { useBudget } from '@/hooks/useBudget';
import { selectModelForTask } from '../../domain/model-selector';
import { behaviorTracker } from '../../lib/smart-defaults/inference-engine';
import { supabase } from '../../lib/supabase';
import { useToast } from '../components/Toast';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { useContextRevisions } from '@/hooks/useContextRevisions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { analytics } from '@/lib/analytics';
import { storageAdapter } from '@/lib/storage/StorageKeyAdapter';
import { costLedger } from '@/lib/execution/cost-ledger';
import type { CostLedgerEntry } from '@/lib/execution/cost-ledger';
import { costService } from '@/lib/billing/cost-service';
import type { ExportItem } from '@/lib/export/generators';

// Workspace Components
import {
  WorkspaceLayout,
  AssistantColumn,
  WorkspaceSurface,
  ProofPanel,
  OutputDocument,
  WorkspaceHeader,
  WorkspaceFooter,
  TaskQueuePanel,
  CostLedgerPanel,
  RetrievalSourcesPanel,
  AuthenticityPanel,
} from '../components/workspace';

// Existing components for reuse
import { CodraEscalationModal } from '../components/CodraEscalation';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { ContextModal } from '@/components/context/ContextModal';
import { SpecificationSection } from '../components/SpecificationSection';
import { SpecificationGenerationErrorBanner } from '../components/SpecificationGenerationErrorBanner';
import { ConflictDialog } from '../../components/ConflictDialog';
import { ProjectStateManager } from '../../lib/project-state/ProjectStateManager';
import { ExportModal } from '@/components/export/ExportModal';

// Types
import type { OutputStatus, VerificationResult } from '../components/workspace';

const PROJECTS_STORAGE_KEY = 'codra:projects';
const ONBOARDING_PROJECT_KEY = 'codra:onboardingProject';

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const budget = useBudget();

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
  const [specification, setSpecification] = useState<ProjectSpecification | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedOnboardingProfile | null>(null);
  const [taskQueue, setTaskQueue] = useState<TaskQueue | null>(null);
  const [activeTaskId] = useState<string | null>(null);
  const [escalations, setEscalations] = useState<CodraEscalation[]>([]);
  const [localConflictSpecification, setLocalConflictSpecification] = useState<ProjectSpecification | null>(null);
  const conflictShownRef = React.useRef(false);

  // Execution state
  const [taskExecutor] = useState(() => new TaskExecutor());
  const [taskRunStates, setTaskRunStates] = useState<Record<string, 'running' | 'complete' | 'failed'>>({});
  const [toolModels] = useState<Record<string, { modelId: string; providerId: string }>>({});
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);
  const reservationByTask = React.useRef<Record<string, { id: string; amount: number }>>({});
  const [ledgerEntries, setLedgerEntries] = useState<CostLedgerEntry[]>([]);

  // User preferences for timeout
  const { preferences } = useUserPreferences();

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isProofVisible, setIsProofVisible] = useState(false);
  const [proofTrigger, setProofTrigger] = useState<'verification_failed' | 'conflict_detected' | 'user_opened' | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentExportItem, setCurrentExportItem] = useState<ExportItem | null>(null);

  // Specification generation error state
  const [specificationError, setSpecificationError] = useState<string | null>(null);
  const [isRetryingSpecification, setIsRetryingSpecification] = useState(false);

  // Data persistence
  const {
    specification: dbSpecification,
    taskQueue: dbTaskQueue,
    loading: dbLoading,
    saveSpecification: persistSpecification,
    saveTaskQueue: persistTaskQueue,
    conflict,
    setConflict,
    resolveConflict,
    version: currentVersion,
    error: loadError,
  } = useSpecification(projectId);

  const budgetSummary = project?.budgetPolicy ? getBudgetSummary(project.id, project.budgetPolicy) : null;
  const { currentRevision } = useContextRevisions(projectId);
  const estimatedCostTotal = useMemo(() => {
    if (!taskQueue?.tasks) return 0;
    return taskQueue.tasks.reduce((sum, task) => sum + (task.estimatedCost || 0), 0);
  }, [taskQueue]);

  const latestOutput = useMemo(() => {
    if (!taskQueue?.tasks) return null;
    const completed = taskQueue.tasks
      .filter((task) => task.output)
      .sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });
    return completed[0] || null;
  }, [taskQueue]);

  const routingNoteForSection = useCallback((sectionType: string) => {
    if (!taskQueue?.tasks) return null;
    const matches = taskQueue.tasks
      .filter((task) =>
        (task.contextAnchor && task.contextAnchor === sectionType)
      )
      .filter((task) => task.status === 'complete' || task.output)
      .sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

    const task = matches[0];
    if (!task) return null;

    if (task.smartRouting) {
      const mode = task.smartRouting.isAutoRouted ? 'Auto' : 'Manual';
      return `Routing: ${mode} · ${task.smartRouting.modelId} via ${task.smartRouting.providerId}`;
    }

    return null;
  }, [taskQueue]);

  const exportItems = useMemo<ExportItem[]>(() => {
    if (!specification?.sections) return [];
    return specification.sections.map((section) => ({
      id: section.id,
      title: section.title,
      type: section.type,
      content: section.content,
    }));
  }, [specification]);

  const handleExportOutput = useCallback((item: ExportItem) => {
    setCurrentExportItem(item);
    setIsExportModalOpen(true);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLedgerEntries(costLedger.getEntries(projectId));
  }, [projectId, taskQueue, executingTaskId, sessionCost]);

  // Initialize state via ProjectStateManager
  useEffect(() => {
    if (!projectId || dbLoading) return;

    const { state, conflict: initialConflict } = ProjectStateManager.load({
      projectId,
      remote: {
        specification: dbSpecification,
        taskQueue: dbTaskQueue,
      },
      inMemory: {
        specification,
        taskQueue,
        contextSnapshot: currentRevision?.data ?? null,
      },
    });

    if (state.specification !== specification) {
      setSpecification(state.specification);
    }
    if (state.taskQueue !== taskQueue) {
      setTaskQueue(state.taskQueue);
    }
    if (!activeSectionId && state.specification?.sections?.length) {
      setActiveSection(state.specification.sections[0].id);
    }
    if (state.taskQueue?.tasks?.some((task) => task.status === 'pending')) {
      setIsProofVisible(true);
    }

    if (initialConflict?.specification && !conflict) {
      setConflict(initialConflict.specification);
      setLocalConflictSpecification(initialConflict.localSpecification || null);
    }
  }, [
    projectId,
    dbLoading,
    dbSpecification,
    dbTaskQueue,
    specification,
    taskQueue,
    activeSectionId,
    setActiveSection,
    currentRevision,
    conflict,
    setConflict,
  ]);

  useEffect(() => {
    if (!conflict) {
      setLocalConflictSpecification(null);
    }
  }, [conflict]);

  useEffect(() => {
    if (!conflict) {
      conflictShownRef.current = false;
      return;
    }
    if (!conflictShownRef.current) {
      analytics.track('conflict_shown', {
        projectId,
        specificationId: specification?.id,
        serverVersion: conflict.serverVersion,
        overlapCount: conflict.overlap.length,
      });
      conflictShownRef.current = true;
    }
  }, [conflict, projectId, specification?.id]);

  // Real-time subscription for other people's updates
  useEffect(() => {
    if (!projectId || !specification?.id) return;

    const subscription = supabase
      .channel('specification-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'specifications',
          filter: `id=eq.${specification.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.version !== currentVersion && updated.last_modified_by !== user?.id) {
             toast.info("Teammate updated this project. Changes are available.");
             analytics.track('specification_updated_by_other_user', {
               projectId,
               specificationId: specification.id,
               newVersion: updated.version,
             });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [projectId, specification?.id, currentVersion, toast]);

  // Load project
  useEffect(() => {
    if (!projectId) return;

    getProjectById(projectId).then((p) => {
      if (p) {
        setProject(p);
        return;
      }

      if (typeof window === 'undefined') return;

      try {
        const onboardingRaw = localStorage.getItem(ONBOARDING_PROJECT_KEY);
        if (onboardingRaw) {
          const onboarding = JSON.parse(onboardingRaw) as { projectId?: string; projectName?: string };
          if (onboarding?.projectId === projectId) {
            const stubProject: Project = {
              id: projectId,
              name: onboarding.projectName || 'Untitled Project',
              updatedAt: new Date().toISOString(),
            };

            const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : [];
            const projects = Array.isArray(parsed) ? parsed : [];
            const existingIndex = projects.findIndex((project: { id?: string }) => project.id === projectId);
            if (existingIndex >= 0) {
              projects[existingIndex] = { ...projects[existingIndex], ...stubProject };
            } else {
              projects.push(stubProject);
            }
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));

            setProject(stubProject);
          }
        }
      } catch {
        // Ignore storage failures
      }
    });

    const storedProfile = storageAdapter.getOnboardingProfile(projectId);
    if (storedProfile) {
      setExtendedProfile(storedProfile as ExtendedOnboardingProfile);
    }
  }, [projectId]);

  // Generate task queue if none exists
  useEffect(() => {
    if (!project || !projectId || taskQueue || dbLoading) return;
    const newQueue = generateTaskQueue(project, extendedProfile || null, 1);
    setTaskQueue(newQueue);
    persistTaskQueue(newQueue);
  }, [project, projectId, extendedProfile, taskQueue, dbLoading, persistTaskQueue]);

  // Create fallback specification when generation fails
  const createFallbackSpecification = useCallback((proj: Project): ProjectSpecification => {
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

  // Generate specification if none exists
  useEffect(() => {
    if (!project || specification || dbLoading) return;
    try {
      const newSpecification = generateSpecificationFromProfile(project, extendedProfile || null, []);
      setSpecification(newSpecification);
      setSpecificationError(null);
      persistSpecification(newSpecification);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Specification generation failed:', error);
      setSpecificationError(errorMessage);
      
      // Track error in analytics
      analytics.track('specification_generation_error', {
        projectId,
        errorMessage,
        function: 'generateSpecificationFromProfile',
      });
      
      // Set fallback specification so page doesn't show blank
      setSpecification(createFallbackSpecification(project));
    }
  }, [project, specification, dbLoading, extendedProfile, persistSpecification, projectId, createFallbackSpecification]);

  // Retry specification generation
  const handleRetrySpecificationGeneration = useCallback(async () => {
    if (!project) return;
    setIsRetryingSpecification(true);
    
    // Small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const newSpecification = generateSpecificationFromProfile(project, extendedProfile || null, []);
      setSpecification(newSpecification);
      setSpecificationError(null);
      persistSpecification(newSpecification);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Specification generation retry failed:', error);
      setSpecificationError(errorMessage);
      
      analytics.track('specification_generation_error', {
        projectId,
        errorMessage,
        function: 'generateSpecificationFromProfile',
        isRetry: true,
      });
    } finally {
      setIsRetryingSpecification(false);
    }
  }, [project, extendedProfile, persistSpecification, projectId]);

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
      if (!specification) return;
      const updatedSpecification = {
        ...specification,
        sections: specification.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
        updatedAt: new Date().toISOString(),
      };
      setSpecification(updatedSpecification);
      await persistSpecification(updatedSpecification);
    },
    [specification, persistSpecification]
  );

  // Handle task execution
  const handleRunTask = useCallback(
    async (taskId: string, mode: ExecutionMode) => {
      // Single-flight guard: prevent concurrent executions
      if (executingTaskId) {
        toast.info('A task is already running. Please wait.');
        return;
      }
      if (!taskQueue || !specification || !project) return;

      const task = taskQueue.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const validation = taskExecutor.validateTask(task);
      if (!validation.valid) {
        toast.error(`Task validation failed: ${validation.error || 'Unknown error'}`);
        return;
      }

      // Use real budget data from hook (authoritative), falling back to local if undefined
      const currentSpend = budget.spentToday; 
      const guardrails = checkGuardrails(task, project, taskQueue, currentSpend);
      if (shouldEscalate(guardrails)) {
        const escalation = createEscalation(guardrails, task);
        if (escalation) {
          setEscalations((prev) => [...prev, escalation]);
        }
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
          let timedOutQueue = updateTaskStatus(taskQueue, taskId, 'timed-out');
          timedOutQueue = {
            ...timedOutQueue,
            tasks: timedOutQueue.tasks.map((t: SpecificationTask) =>
              t.id === taskId ? { ...t, executionPhase: undefined } : t
            ),
          };
          setTaskQueue(timedOutQueue);
          persistTaskQueue(timedOutQueue);
        }

        setExecutingTaskId(null);
        setTimeRemaining(null);
        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));

        if (mode === 'execute') {
          const reservation = reservationByTask.current[taskId];
          if (reservation) {
            costLedger.rollback({
              projectId: project.id,
              taskId,
              amount: reservation.amount,
              relatedEntryId: reservation.id,
              metadata: { reason: 'task_timeout' },
            });
            delete reservationByTask.current[taskId];
          }
        }

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
      const toolOverride = toolModels[task.toolId];
      let effectiveModelId: string;
      let effectiveProviderId: string;
      let smartRouting;

      if (toolOverride) {
        effectiveModelId = toolOverride.modelId;
        effectiveProviderId = toolOverride.providerId;
        smartRouting = { modelId: effectiveModelId, providerId: effectiveProviderId, reason: 'Manual Tool Override', isAutoRouted: false };
      } else {
        const smartMatch = selectModelForTask(task.toolId, task.title);
        effectiveModelId = smartMatch.modelId;
        effectiveProviderId = smartMatch.providerId;
        smartRouting = { modelId: effectiveModelId, providerId: effectiveProviderId, reason: smartMatch.reason, isAutoRouted: true };
      }

      // Analytics: task started
      analytics.track('flow_task_began', {
        taskId,
        taskType: task.toolId,
        toolId: task.toolId,
        specificationId: specification.id,
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
              metadata: { taskId, taskTitle: task.title, toolId: task.toolId, projectId: project.id },
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
        tasks: updatedQueue.tasks.map((t: SpecificationTask) =>
          t.id === taskId ? { ...t, startedAt: startedAtMs, executionPhase: 'Collecting context' } : t
        ),
      };
      setTaskQueue(updatedQueue);
      if (mode === 'execute') persistTaskQueue(updatedQueue);

      try {
        if (mode === 'execute') {
          const estimatedCost = task.estimatedCost ?? costService.getDefaultRequestCost();
          const reservation = costLedger.reserve({
            projectId: project.id,
            taskId: task.id,
            amount: estimatedCost,
            metadata: {
              reason: 'task_start',
              modelId: effectiveModelId,
              providerId: effectiveProviderId,
            },
          });
          reservationByTask.current[task.id] = { id: reservation.id, amount: estimatedCost };
        }

        const promptContext = buildPromptContext(
          specification,
          extendedProfile || null,
          activeSectionId || undefined,
          taskQueue.tasks,
          activeTask || undefined
        );

        const promptResult = generatePromptForTask(task, promptContext);

        updatedQueue = {
          ...updatedQueue,
          tasks: updatedQueue.tasks.map((t: SpecificationTask) =>
            t.id === taskId ? { ...t, executionPhase: 'Generating output' } : t
          ),
        };
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        const result = await taskExecutor.executeTask({
          task,
          prompt: promptResult.prompt,
          context: promptContext,
          modelId: effectiveModelId,
          providerId: effectiveProviderId,
          mode,
        });

        updatedQueue = {
          ...updatedQueue,
          tasks: updatedQueue.tasks.map((t: SpecificationTask) =>
            t.id === taskId ? { ...t, executionPhase: 'Saving output' } : t
          ),
        };
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        updatedQueue = updateTaskStatus(updatedQueue, taskId, 'complete');
        const finalTasks = updatedQueue.tasks.map((t: SpecificationTask) =>
          t.id === taskId
            ? {
                ...t,
                memory: result.memory,
                output: result.output,
                actualCost: result.cost,
                tokensUsed: result.tokensUsed,
                smartRouting,
                completedAt: new Date().toISOString(),
                executionPhase: undefined,
              }
            : t
        );
        updatedQueue = { ...updatedQueue, tasks: finalTasks };
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        if (mode === 'execute') {
          costLedger.commit({
            projectId: project.id,
            taskId: task.id,
            amount: result.cost,
            metadata: {
              reason: 'task_complete',
              modelId: result.modelUsed,
              providerId: result.providerUsed,
            },
          });

          const reservation = reservationByTask.current[task.id];
          if (reservation) {
            costLedger.rollback({
              projectId: project.id,
              taskId: task.id,
              amount: reservation.amount,
              relatedEntryId: reservation.id,
              metadata: { reason: 'task_settled' },
            });
            delete reservationByTask.current[task.id];
          }

          addToSessionCost(result.cost);
        }

        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'complete' }));

        // Analytics: task completed
        analytics.track('flow_task_completed', {
          taskId,
          taskType: task.toolId,
          toolId: task.toolId,
          modelUsed: result.modelUsed,
          cost: result.cost,
          durationMs: Math.round(performance.now() - startedAt),
        });

        toast.success(`${mode === 'preview' ? 'Preview' : 'Execution'} complete • ${result.tokensUsed} tokens`);
      } catch (error) {
        console.error('[AI Task Execution Failed]', error);
        updatedQueue = updateTaskStatus(updatedQueue, taskId, 'pending');
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        updatedQueue = {
          ...updatedQueue,
          tasks: updatedQueue.tasks.map((t: SpecificationTask) =>
            t.id === taskId ? { ...t, executionPhase: undefined } : t
          ),
        };
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));
        setProofTrigger('verification_failed');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (mode === 'execute') {
          const reservation = reservationByTask.current[task.id];
          if (reservation) {
            costLedger.rollback({
              projectId: project.id,
              taskId: task.id,
              amount: reservation.amount,
              relatedEntryId: reservation.id,
              metadata: { reason: 'task_failed' },
            });
            delete reservationByTask.current[task.id];
          }
        }

        // Analytics: task failed
        analytics.track('flow_task_failed', {
          taskId,
          taskType: task.toolId,
          toolId: task.toolId,
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
      specification,
      project,
      extendedProfile,
      activeSectionId,
      taskExecutor,
      toolModels,
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

    // Optimistic Update: Stop immediately
    const cancelledAt = Date.now();
    
    // 1. Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // 2. Update UI State
    if (taskQueue) {
      const updatedQueue = updateTaskStatus(taskQueue, taskId, 'cancelled');
      const finalTasks = updatedQueue.tasks.map((t: SpecificationTask) =>
        t.id === taskId ? { ...t, cancelledAt, executionPhase: undefined } : t
      );
      const finalQueue = { ...updatedQueue, tasks: finalTasks };
      setTaskQueue(finalQueue);
      persistTaskQueue(finalQueue);
    }

    setExecutingTaskId(null);
    setTimeRemaining(null);
    setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));
    toast.info('Task cancelled');

    // 3. Rollback Cost
    const reservation = reservationByTask.current[taskId];
    if (reservation && projectId) {
      costLedger.rollback({
        projectId,
        taskId,
        amount: reservation.amount,
        relatedEntryId: reservation.id,
        metadata: { reason: 'task_cancelled' },
      });
      delete reservationByTask.current[taskId];
    }

    // 4. Track Analytics
    analytics.track('task_cancelled', {
      taskId,
      projectId,
      durationMs: cancelledAt - startTime,
    });

    // 5. Signal Backend (Fire & Forget)
    fetch('/.netlify/functions/task-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, taskId }),
    }).catch(err => {
      console.error('Backend cancellation failed (ignored):', err);
    });

  }, [executingTaskId, projectId, taskQueue, persistTaskQueue, toast]);


  // Handle escalation resolution
  const handleResolveEscalation = (id: string, confirmed: boolean) => {
    if (confirmed) {
      setEscalations((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
    } else {
      setEscalations((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleConflictResolution = useCallback(
    async (choice: 'local' | 'remote') => {
      if (!conflict || !projectId || !specification?.id) return;
      const resolvedData = choice === 'local'
        ? (localConflictSpecification || specification)
        : (conflict.serverData as ProjectSpecification);

      analytics.track('conflict_resolved', {
        projectId,
        specificationId: specification.id,
        choice,
        serverVersion: conflict.serverVersion,
      });

      if (resolvedData) {
        setSpecification(resolvedData);
      }

      setLocalConflictSpecification(null);
      await resolveConflict(choice === 'local' ? 'mine' : 'theirs', projectId, specification.id, resolvedData);
    },
    [conflict, projectId, specification, localConflictSpecification, resolveConflict]
  );

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

  const costSummary = useMemo(() => {
    if (!budgetSummary) return null;
    const remaining = Math.max(0, budgetSummary.limit - budgetSummary.spent);
    return {
      estimated: estimatedCostTotal,
      spent: budgetSummary.spent,
      remaining,
      status: budgetSummary.status,
    };
  }, [budgetSummary, estimatedCostTotal]);

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
    <ErrorBoundary name="Workspace Layout">
      <AssistantProvider>
        {/* Blocking Escalation Modal */}
        {blockingEscalation && (
          <CodraEscalationModal
            escalation={blockingEscalation}
            onConfirm={() => handleResolveEscalation(blockingEscalation.id, true)}
            onCancel={() => handleResolveEscalation(blockingEscalation.id, false)}
          />
        )}

        <WorkspaceLayout
          projectId={projectId || ''}
          proofTrigger={proofTrigger}
          proofVisible={isProofVisible}
          onToggleProof={(visible) => setIsProofVisible(visible)}
          headerContent={
            <WorkspaceHeader
              projectName={project.name}
              projectId={projectId || ''}
              assistantVisible={layout.leftDockVisible}
              onToggleAssistant={() => toggleDock('left')}
              onToggleProof={() => setIsProofVisible(!isProofVisible)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              costSummary={costSummary || undefined}
            />
          }
          footerContent={
            <WorkspaceFooter
              completedTasks={taskQueue?.tasks.filter((t) => t.status === 'complete').length || 0}
              totalTasks={taskQueue?.tasks.length || 0}
              sessionCost={sessionCost}
            />
          }
          assistantContent={
            <div data-tour="assistant">
              <AssistantColumn
                specificationId={specification?.id}
                toolId={activeTask?.toolId}
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
                  timeoutSeconds={(preferences.taskTimeoutMinutes ?? 30) * 60}
                />
              </div>
              <CostLedgerPanel
                projectId={projectId || ''}
                entries={ledgerEntries}
              />
              <RetrievalSourcesPanel projectId={projectId || undefined} />
              <AuthenticityPanel
                output={latestOutput?.output}
                title={latestOutput?.title}
              />
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
          {/* CENTER: Workspace Surface - PRIMARY */}
          <WorkspaceSurface
            isEmpty={!hasOutputs && !specificationError}
          >
            {/* Error Banner for specification generation failures */}
            {(specificationError || loadError) && (
              <SpecificationGenerationErrorBanner
                errorMessage={specificationError || loadError || 'Unknown error'}
                onRetry={handleRetrySpecificationGeneration}
                isRetrying={isRetryingSpecification}
              />
            )}

            {/* Outputs as documents */}
            {specification?.sections.map((section) => (
              <OutputDocument
                key={section.id}
                id={section.id}
                title={section.title}
                status={mapSectionStatus(section.status)}
                source={section.source.replace('_', ' ')}
                isActive={section.id === activeSectionId}
                annotation={routingNoteForSection(section.type) || undefined}
                onExport={() =>
                  handleExportOutput({
                    id: section.id,
                    title: section.title,
                    type: section.type,
                    content: section.content,
                  })
                }
              >
                <SpecificationSection
                  section={section}
                  isActive={section.id === activeSectionId}
                  onUpdate={handleSectionUpdate}
                />
              </OutputDocument>
            ))}
          </WorkspaceSurface>
        </WorkspaceLayout>

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
          onUseMine={() => handleConflictResolution('local')}
          onUseTheirs={() => handleConflictResolution('remote')}
        />
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          defaultScope="output"
          currentOutput={currentExportItem}
          items={exportItems}
          projectName={project?.name || 'codra-project'}
        />
      </AssistantProvider>
    </ErrorBoundary>
  );
}
