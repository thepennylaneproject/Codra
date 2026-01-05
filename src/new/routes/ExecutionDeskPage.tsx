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
import { SpreadTask, TaskQueue } from '../../domain/task-queue';
import { generateTaskQueue, updateTaskStatus } from '../../domain/spread/task-queue-engine';
import { generatePromptForTask, buildPromptContext, PromptContext } from '../../lib/lyra/LyraPromptEngine';
import { checkGuardrails, shouldEscalate, createEscalation, getBudgetSummary, getTodaysBudget } from '../../lib/codra/codra-guardrails';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { useProviderRegistry } from '../../lib/ai/registry/useProviderRegistry';
import { selectModelForTask } from '../../domain/model-selector';
import { behaviorTracker } from '../../lib/smart-defaults/inference-engine';
import { supabase } from '../../lib/supabase';
import { useToast } from '../components/Toast';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { useContextRevisions } from '@/hooks/useContextRevisions';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Workspace Components
import {
  ExecutionDesk,
  LyraConversationColumn,
  ExecutionSurface,
  ProofPanel,
  OutputDocument,
  ExecutionDeskHeader,
  ExecutionDeskFooter,
} from '../components/workspace';

// Existing components for reuse
import { CodraEscalationModal } from '../components/CodraEscalation';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { ContextModal } from '@/components/context/ContextModal';
import { SpreadSection } from '../components/SpreadSection';

// Types
import type { OutputStatus, VerificationResult, Conflict, SynthesisNote } from '../components/workspace';

export function ExecutionDeskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const toast = useToast();

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
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [escalations, setEscalations] = useState<CodraEscalation[]>([]);

  // Execution state
  const [taskExecutor] = useState(() => new TaskExecutor());
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('preview');
  const [taskRunStates, setTaskRunStates] = useState<Record<string, 'running' | 'complete' | 'failed'>>({});
  const [deskModels, setDeskModels] = useState<Record<string, { modelId: string; providerId: string }>>({});

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [proofTrigger, setProofTrigger] = useState<'verification_failed' | 'conflict_detected' | 'user_opened' | null>(null);

  // Model selection
  const { providers } = useProviderRegistry();
  const [selectedModelId] = useState('gpt-4o');
  const [selectedProviderId] = useState('openai');

  // Data persistence
  const {
    spread: dbSpread,
    taskQueue: dbTaskQueue,
    loading: dbLoading,
    saveSpread: persistSpread,
    saveTaskQueue: persistTaskQueue,
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
    }
  }, [dbTaskQueue]);

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
    const newQueue = generateTaskQueue(project, extendedProfile || (undefined as any), 1);
    setTaskQueue(newQueue);
    persistTaskQueue(newQueue);
  }, [project, projectId, extendedProfile, taskQueue, dbLoading, persistTaskQueue]);

  // Generate spread if none exists
  useEffect(() => {
    if (!project || spread || dbLoading) return;
    const newSpread = generateSpreadFromProfile(project, extendedProfile || (undefined as any), []);
    setSpread(newSpread);
    persistSpread(newSpread);
  }, [project, spread, dbLoading, extendedProfile, persistSpread]);

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
    (sectionId: string, content: Record<string, unknown>) => {
      if (!spread) return;
      const updatedSpread = {
        ...spread,
        sections: spread.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
        updatedAt: new Date().toISOString(),
      };
      setSpread(updatedSpread);
      persistSpread(updatedSpread);
    },
    [spread, persistSpread]
  );

  // Handle task execution
  const handleRunTask = useCallback(
    async (taskId: string, mode: ExecutionMode) => {
      if (!taskQueue || !spread || !project) return;

      const task = taskQueue.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const validation = taskExecutor.validateTask(task);
      if (!validation.valid) {
        console.error('[Task Validation Failed]', validation.error);
        return;
      }

      setTaskRunStates((prev) => ({ ...prev, [taskId]: 'running' }));

      // Track behavior
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
      setTaskQueue(updatedQueue);
      if (mode === 'execute') persistTaskQueue(updatedQueue);

      try {
        const promptContext = buildPromptContext(
          spread,
          extendedProfile || (undefined as any),
          activeSectionId || undefined,
          taskQueue.tasks,
          activeTask || undefined
        );

        const promptResult = generatePromptForTask(task, promptContext);

        // Model selection
        const deskOverride = deskModels[task.deskId];
        let effectiveModelId = selectedModelId;
        let effectiveProviderId = selectedProviderId;
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
        toast.success(`${mode === 'preview' ? 'Preview' : 'Execution'} complete`);
      } catch (error) {
        console.error('[AI Task Execution Failed]', error);
        updatedQueue = updateTaskStatus(taskQueue, taskId, 'pending');
        setTaskQueue(updatedQueue);
        if (mode === 'execute') persistTaskQueue(updatedQueue);

        setTaskRunStates((prev) => ({ ...prev, [taskId]: 'failed' }));
        setProofTrigger('verification_failed');
        toast.error(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      selectedModelId,
      selectedProviderId,
      persistTaskQueue,
      addToSessionCost,
      toast,
      activeTask,
    ]
  );

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
  const isRunning = Object.values(taskRunStates).includes('running') || activeTask?.status === 'in-progress';
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
          headerContent={
            <ExecutionDeskHeader
              projectName={project.name}
              projectId={projectId || ''}
              lyraVisible={layout.leftDockVisible}
              onToggleLyra={() => toggleDock('left')}
              onOpenSettings={() => setIsSettingsOpen(true)}
              statusLabel={isRunning ? 'Running' : hasOutputs ? 'Complete' : undefined}
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
            <LyraConversationColumn
              spreadId={spread?.id}
              deskId={activeTask?.deskId}
              contextSummary={contextSummary}
              onEditContext={() => setIsContextModalOpen(true)}
            />
          }
          proofContent={
            <ProofPanel
              verificationResults={verificationResults}
              conflicts={[]}
              synthesisNotes={[]}
              onClose={() => setProofTrigger(null)}
            />
          }
        >
          {/* CENTER: Execution Surface - PRIMARY */}
          <ExecutionSurface
            isEmpty={!hasOutputs}
            isExecuting={isRunning}
            executionLabel={activeTask?.title}
          >
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
      </LyraProvider>
    </ErrorBoundary>
  );
}
