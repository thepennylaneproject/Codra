import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Project, Spread, CodraEscalation, Asset } from '../../domain/types';
import { generateSpreadFromProfile } from '../../domain/spread/engine';
import { useProviderRegistry } from '../../lib/ai/registry/useProviderRegistry';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { getProjectById } from '../../domain/projects';
import { X, ChevronDown } from 'lucide-react';
import { CodraEscalationModal } from '../components/CodraEscalation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { TOCSidebar } from '../components/TOCSidebar';
import { selectModelForTask } from '../../domain/model-selector';
import { LyraProvider } from '../../lib/lyra';
import { TaskExecutor, ExecutionMode } from '../../lib/ai/execution/task-executor';
import { getPreviewGuardrail } from '../../lib/ai/execution/preview-guardrails';
import { behaviorTracker } from '../../lib/smart-defaults/inference-engine';
import { supabase } from '../../lib/supabase';

// Task Queue imports
import { SpreadTask, TaskQueue } from '../../domain/task-queue';
import { generateTaskQueue, updateTaskStatus } from '../../domain/spread/task-queue-engine';
import { generatePromptForTask, buildPromptContext, PromptContext } from '../../lib/lyra/LyraPromptEngine';
import { DeskSuggestion } from '../../lib/desk-suggestions';
import { checkGuardrails, shouldEscalate, createEscalation, getBudgetSummary, getTodaysBudget } from '../../lib/codra/codra-guardrails';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { PromptBacklog } from '../components/PromptBacklog';
import { OutputInspector } from '../components/OutputInspector';
import { GitPanel } from '../components/panels/git/GitPanel';
import { DeployPanel } from '../components/panels/deploy/DeployPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useToast } from '../components/Toast';
import { TaskHistorySidebar } from '../../components/task/TaskHistorySidebar';
import { usePromptArchitectStore } from '../../lib/prompt-architect/prompt-architect-store';
import { LyraPanel } from '../components/LyraPanel';
import { SpreadSection } from '../components/SpreadSection';

// Shell Components
import { WorkspaceHeader } from '../components/shell/WorkspaceHeader';
import { ActivityStrip } from '../components/shell/ActivityStrip';
import { CodraWorkspace } from '../components/CodraWorkspace';
import { PromptArchitectPanel } from '../components/panels/PromptArchitectPanel';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { uploadAssets } from '../../lib/assets/upload';
import { useProjectMemory } from '../../lib/memory/useProjectMemory';
import { ModelDiagnostics } from '../components/advanced/ModelDiagnostics';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { ExportModal } from '@/components/export/ExportModal';
import { ContextModal } from '@/components/context/ContextModal';
import { useContextRevisions } from '@/hooks/useContextRevisions';
import { useStudioMode } from '@/hooks/useStudioMode';
import { analytics } from '@/lib/analytics';
import { AssetRegistryPanel } from '../components/panels/AssetRegistryPanel';
import { useLyraOptional } from '../../lib/lyra';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function NewSpreadPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    // Store State
    const {
        layout,
        updateLayout,
        toggleDock,
        activeSectionId,
        setActiveSection,
        addToSessionCost,
        sessionCost
    } = useFlowStore();
    const { studioEnabled, setStudioEnabled } = useStudioMode();
    const lyra = useLyraOptional();

    // Context Memory System
    const { usageStats } = useProjectMemory(projectId);

    const [project, setProject] = useState<Project | null>(null);
    const [spread, setSpread] = useState<Spread | null>(null);
    const [extendedProfile, setExtendedProfile] = useState<ExtendedOnboardingProfile | null>(null);
    const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
    const [escalations, setEscalations] = useState<CodraEscalation[]>([]);
    const mainRef = useRef<HTMLDivElement>(null);

    // Task Queue State
    const [taskQueue, setTaskQueue] = useState<TaskQueue | null>(null);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

    // Suppress unused warnings for now as they are used in handleRunTask
    void generatedPrompt; 
    void executingTaskId;

    const [activeBottomPanel, setActiveBottomPanel] = useState<'git' | 'deploy' | 'preview' | null>(null);
    const [activeLeftTab, setActiveLeftTab] = useState<'toc' | 'prompts'>('toc');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showModelDiagnostics, setShowModelDiagnostics] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsScope, setSettingsScope] = useState<'task' | 'project' | 'global'>('project');
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isAssetsOpen, setIsAssetsOpen] = useState(false);
    const [isContextExpanded, setIsContextExpanded] = useState(false);
    const [isStrategyOpen, setIsStrategyOpen] = useState(false);

    // AI Model Selection
    const { providers } = useProviderRegistry();
    const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
    const [selectedProviderId, setSelectedProviderId] = useState('openai');
    void setSelectedModelId;
    void setSelectedProviderId;

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { setIntent, setMode, setSelectedModel } = usePromptArchitectStore();

    // Task Executor
    const [taskExecutor] = useState(() => new TaskExecutor());
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('preview');
    const [taskRunModes, setTaskRunModes] = useState<Record<string, ExecutionMode>>({});
    const [taskRunStates, setTaskRunStates] = useState<Record<string, 'running' | 'complete' | 'failed'>>({});

    // Desk-specific AI Model overrides
    const [deskModels, setDeskModels] = useState<Record<string, { modelId: string; providerId: string }>>({});

    // Supabase Persistence Hook
    const {
        spread: dbSpread,
        taskQueue: dbTaskQueue,
        loading: dbLoading,
        saveSpread: persistSpread,
        saveTaskQueue: persistTaskQueue,
    } = useSupabaseSpread(projectId);
    const budgetSummary = project?.budgetPolicy ? getBudgetSummary(project.id, project.budgetPolicy) : null;
    const { revisions, currentRevision } = useContextRevisions(projectId);

    // Initialize state from Supabase when loaded
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

    // Initialize
    useEffect(() => {
        if (!projectId) return;

        getProjectById(projectId).then(p => {
            if (p) {
                setProject(p);
                setAssets(p.assets || []);
            }
        });

        // Load extended profile from localStorage
        const profileStr = localStorage.getItem(`codra:onboardingProfile:${projectId}`);
        if (profileStr) {
            try {
                setExtendedProfile(JSON.parse(profileStr));
            } catch {
                console.warn('Failed to parse extended profile');
            }
        }
    }, [projectId]);

    // Keyboard shortcut for Model Diagnostics (Cmd/Ctrl+Shift+M)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                setShowModelDiagnostics(prev => !prev);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                setSettingsScope(activeTaskId ? 'task' : 'project');
                setIsSettingsOpen(true);
            }
            if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                setIsContextModalOpen(true);
            }
            if (e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                const next = !studioEnabled;
                setStudioEnabled(next);
                if (next) {
                    analytics.track('studio_toggle_enabled', { source: 'keyboard_shortcut' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTaskId, setStudioEnabled, studioEnabled]);

    // Listen for open context modal event from checklist
    useEffect(() => {
        const handleOpenContextModal = () => {
            setIsContextModalOpen(true);
        };

        window.addEventListener('codra:open-context-modal', handleOpenContextModal);
        return () => window.removeEventListener('codra:open-context-modal', handleOpenContextModal);
    }, []);

    // Handle TOC navigation
    const handleNavigateToSection = (sectionId: string) => {
        // Handle Production Desk navigation
        if (sectionId.startsWith('desk-')) {
            const deskId = sectionId.replace('desk-', '');
            navigate(`/p/${projectId}/production?desk=${deskId}`);
            return;
        }

        setActiveSection(sectionId);
        const element = document.getElementById(`section-${sectionId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Handle section update
    const handleSectionUpdate = (sectionId: string, content: Record<string, unknown>) => {
        if (!spread) return;
        const updatedSpread = {
            ...spread,
            sections: spread.sections.map(s =>
                s.id === sectionId ? { ...s, content } : s
            ),
            updatedAt: new Date().toISOString(),
        };
        setSpread(updatedSpread);
        persistSpread(updatedSpread);
    };

    // Handle task selection from TOC
    const handleTaskSelect = useCallback((task: SpreadTask) => {
        if (!project || !taskQueue || !spread) return;

        setActiveTaskId(task.id);

        // Build prompt context
        const promptContext: PromptContext = buildPromptContext(spread, extendedProfile || undefined as any, activeSectionId || undefined, taskQueue.tasks, activeTask || undefined);

        // Check guardrails before generating prompt
        const budgetSpent = getTodaysBudget(project.id).spent;
        const guardrails = checkGuardrails(task, project, taskQueue, budgetSpent);

        if (shouldEscalate(guardrails)) {
            // Create and show escalation
            const escalation = createEscalation(guardrails, task);
            if (escalation) {
                setEscalations(prev => [...prev, escalation]);
            }
            return;
        }

        // Generate prompt using Lyra
        const promptResult = generatePromptForTask(task, promptContext);
        setGeneratedPrompt(promptResult.prompt);

        // Scroll to relevant section based on task's tearSheetAnchor
        const targetSection = spread.sections.find(s =>
            s.type.includes(task.tearSheetAnchor || '') ||
            s.title.toLowerCase().includes(task.tearSheetAnchor || '')
        );
        if (targetSection) {
            handleNavigateToSection(targetSection.id);
        }

        // Log for now
        console.log('[Task Selected]', {
            task: task.title,
            desk: task.deskId,
            prompt: promptResult.prompt,
            lyraMessage: promptResult.lyraMessage,
        });
    }, [project, taskQueue, spread, extendedProfile, activeSectionId, navigate, projectId, setActiveSection]);

    useEffect(() => {
        if (!project || !projectId || taskQueue || dbLoading) return;

        // Generate a new task queue if none exists in DB
        const newQueue = generateTaskQueue(project, extendedProfile || undefined as any, 1);
        setTaskQueue(newQueue);
        persistTaskQueue(newQueue);
    }, [project, projectId, extendedProfile, taskQueue, dbLoading, persistTaskQueue]);

    // Generate spread when project is loaded if none exists in DB
    useEffect(() => {
        if (!project || spread || dbLoading) return;

        console.log('[NewSpreadPage] No spread found, generating from profile...');
        const newSpread = generateSpreadFromProfile(project, extendedProfile || undefined as any, []);
        setSpread(newSpread);
        persistSpread(newSpread);
    }, [project, spread, dbLoading, extendedProfile, persistSpread]);

    const handleRunTask = useCallback(async (taskId: string, mode: ExecutionMode) => {
        if (!taskQueue || !spread || !project) return;

        const task = taskQueue.tasks.find(t => t.id === taskId);
        if (!task) return;
        if (mode === 'preview' && getPreviewGuardrail(task).blocked) {
            toast.error('This workflow includes steps that cannot be previewed without side effects.');
            return;
        }

        // Validate task
        const validation = taskExecutor.validateTask(task);
        if (!validation.valid) {
            console.error('[Task Validation Failed]', validation.error);
            // TODO: Show toast notification
            return;
        }

        setExecutingTaskId(taskId);
        setTaskRunModes(prev => ({ ...prev, [taskId]: mode }));
        setTaskRunStates(prev => ({ ...prev, [taskId]: 'running' }));

        // Track task rerun for behavior learning
        if (mode === 'execute' && task.status === 'complete') {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    behaviorTracker.track({
                        userId: session.user.id,
                        timestamp: new Date(),
                        event: 'task_rerun',
                        metadata: {
                            taskId,
                            taskTitle: task.title,
                            deskId: task.deskId,
                            projectId: project.id
                        }
                    });
                }
            } catch (err) {
                console.error('Failed to track task rerun:', err);
            }
        }

        // Set to in-progress
        let updatedQueue = updateTaskStatus(taskQueue, taskId, 'in-progress');
        setTaskQueue(updatedQueue);
        if (mode === 'execute') {
            persistTaskQueue(updatedQueue);
        }

        try {
            // Build prompt context
            const promptContext = buildPromptContext(
                spread,
                extendedProfile || (undefined as any),
                activeSectionId || undefined,
                taskQueue.tasks,
                activeTask || undefined
            );

            // Generate prompt using Lyra
            const promptResult = generatePromptForTask(task, promptContext);

            // Determine which model to use (Desk Override > Smart Selection > Default)
            const deskOverride = deskModels[task.deskId];
            let effectiveModelId = selectedModelId;
            let effectiveProviderId = selectedProviderId;
            let smartRouting = undefined;

            if (deskOverride) {
                effectiveModelId = deskOverride.modelId;
                effectiveProviderId = deskOverride.providerId;
                smartRouting = {
                    modelId: effectiveModelId,
                    providerId: effectiveProviderId,
                    reason: 'Manual Desk Override',
                    isAutoRouted: false
                };
            } else {
                const smartMatch = selectModelForTask(task.deskId, task.title);
                effectiveModelId = smartMatch.modelId;
                effectiveProviderId = smartMatch.providerId;
                smartRouting = {
                    modelId: effectiveModelId,
                    providerId: effectiveProviderId,
                    reason: smartMatch.reason,
                    isAutoRouted: true
                };
                console.log(`[Smart Routing] Path: Smart Selection -> ${effectiveModelId}`);
            }

            console.log(`[AI Task] Starting "${task.title}" with ${effectiveModelId} (${effectiveProviderId})`);

            // Execute with real AI
            const result = await taskExecutor.executeTask({
                task,
                prompt: promptResult.prompt,
                context: promptContext,
                modelId: effectiveModelId,
                providerId: effectiveProviderId,
                mode,
            });

            // Update to complete with real AI output
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
                        smartRouting: smartRouting,
                        completedAt: new Date().toISOString(),
                    }
                    : t
            );
            updatedQueue = { ...updatedQueue, tasks: finalTasks };
            setTaskQueue(updatedQueue);
            if (mode === 'execute') {
                persistTaskQueue(updatedQueue);
            }

            // Track session cost
            if (mode === 'execute') {
                addToSessionCost(result.cost);
            }

            console.log(
                `[AI Task Complete] ${result.modelUsed} | ${result.tokensUsed} tokens | $${result.cost.toFixed(4)} | ${result.durationMs}ms`
            );

            // Success feedback
            setTaskRunStates(prev => ({ ...prev, [taskId]: 'complete' }));
            const completionLabel = mode === 'preview' ? 'Preview complete' : 'Execution complete';
            toast.success(`${completionLabel} • ${result.tokensUsed} tokens`);
        } catch (error) {
            console.error('[AI Task Execution Failed]', error);

            // Revert to pending
            updatedQueue = updateTaskStatus(taskQueue, taskId, 'pending');
            setTaskQueue(updatedQueue);
            if (mode === 'execute') {
                persistTaskQueue(updatedQueue);
            }

            // Error feedback with longer duration
            setTaskRunStates(prev => ({ ...prev, [taskId]: 'failed' }));
            const failureLabel = mode === 'preview' ? 'Preview failed' : 'Execution failed';
            toast.error(`${failureLabel}: ${error instanceof Error ? error.message : 'Unknown error'}`, 8000);
        } finally {
            setExecutingTaskId(null);
        }
    }, [
        taskQueue,
        spread,
        project,
        extendedProfile,
        activeSectionId,
        taskExecutor,
        deskModels,
        selectedModelId,
        selectedProviderId,
        providers,
        persistTaskQueue,
        addToSessionCost,
        toast,
        taskExecutor,
    ]);

    const handleReplay = useCallback(async (task: SpreadTask) => {
        if (!taskQueue) return;

        analytics.track('task_replay_clicked', { 
            original_task_id: task.id,
            deskId: task.deskId,
            modelId: task.smartRouting?.modelId || selectedModelId
        });

        const newTask: SpreadTask = {
            ...task,
            id: `task-${Date.now()}`,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: undefined,
            output: undefined,
            memory: undefined,
            artifactId: undefined,
            order: taskQueue.tasks.length + 1,
        };

        const updatedQueue = {
            ...taskQueue,
            tasks: [...taskQueue.tasks, newTask]
        };

        setTaskQueue(updatedQueue);
        await persistTaskQueue(updatedQueue);
        
        toast.info(`Replaying task: ${task.title}`);
        handleRunTask(newTask.id, executionMode);
    }, [taskQueue, persistTaskQueue, handleRunTask, selectedModelId, toast, executionMode]);

    const handleRemix = useCallback((task: SpreadTask) => {
        analytics.track('task_remix_clicked', { 
            original_task_id: task.id,
            deskId: task.deskId 
        });

        // 1. Pre-fill Architect Store
        setIntent(''); // Clear intent as requested
        setMode('precise'); // Default to precise for remixing
        if (task.smartRouting?.modelId) {
            setSelectedModel(task.smartRouting.modelId);
        }

        // 2. Open Architect Panel
        if (!layout.rightDockVisible) {
            toggleDock('right');
        }
        setIsStrategyOpen(true);
        setIsHistoryOpen(false); // Close history to show architect

        toast.info('Remixing task: Intent cleared, parameters pre-filled.');
    }, [layout.rightDockVisible, toggleDock, setIntent, setMode, setSelectedModel, toast]);

    const handleResolveEscalation = (id: string, confirmed: boolean) => {
        if (confirmed) {
            setEscalations(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e));
        } else {
            setEscalations(prev => prev.filter(e => e.id !== id));
        }
    };

    const startResizing = (side: 'left' | 'right') => (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(side);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const stopResizing = useCallback(() => {
        setIsResizing(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        if (isResizing === 'left') {
            const newWidth = Math.max(200, Math.min(400, e.clientX));
            updateLayout({ leftDockWidth: newWidth });
        } else {
            const newWidth = Math.max(240, Math.min(600, window.innerWidth - e.clientX));
            updateLayout({ rightDockWidth: newWidth });
        }
    }, [isResizing, updateLayout]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, onMouseMove, stopResizing]);

    const blockingEscalation = escalations.find(e => e.severity === 'blocking' && !e.resolved);
    const activeTask = activeTaskId ? taskQueue?.tasks.find(t => t.id === activeTaskId) || null : null;
    const taskComplete = activeTask?.status === 'complete';
    const suggestedDeskId = activeTask?.deskId ?? null;
    const hasOutputs = Boolean(taskQueue?.tasks.some(task => task.status === 'complete' || Boolean(task.output)));
    const isRunning = Object.values(taskRunStates).includes('running') || activeTask?.status === 'in-progress';
    const hasFailed = Object.values(taskRunStates).includes('failed');
    const executionState = hasFailed ? 'Failed' : isRunning ? 'Running' : hasOutputs ? 'Complete' : 'Idle';
    const isIdle = executionState === 'Idle';
    const contextSummary = currentRevision?.summary?.trim() || '';
    const hasContextSummary = Boolean(contextSummary);
    const hasContextDetails = Boolean(
        currentRevision?.data?.audience?.primary ||
        currentRevision?.status ||
        revisions.length > 0
    );
    const outputSections = spread?.sections || [];
    useEffect(() => {
        if (isIdle) {
            setIsStrategyOpen(false);
        }
    }, [isIdle]);

    const handleBatchCreateTasks = async (suggestions: DeskSuggestion[]) => {
        if (!taskQueue || !activeTask) return;

        const now = new Date().toISOString();
        const newTasks: SpreadTask[] = suggestions.map((s, i) => ({
            id: `task-${Date.now()}-${i}`,
            title: s.title,
            description: s.description,
            deskId: s.deskId,
            status: 'pending',
            order: taskQueue.tasks.length + i + 1,
            priority: 'normal',
            dependencies: [activeTask.id],
            contextArtifactIds: activeTask.artifactId ? [activeTask.artifactId] : [],
            createdAt: now,
            updatedAt: now,
        }));

        const updatedQueue = {
            ...taskQueue,
            tasks: [...taskQueue.tasks, ...newTasks]
        };

        setTaskQueue(updatedQueue);
        await persistTaskQueue(updatedQueue);
        
        toast.success(`Created ${newTasks.length} follow-up tasks`);
    };

    if (!project) {
        return <div className="h-screen bg-[var(--color-ivory)] text-text-primary/40 flex items-center justify-center font-mono text-xs">Loading workspace...</div>;
    }

    return (
        <ErrorBoundary name="Active Workspace">
            <LyraProvider>
                <div className="workspace-surface flex flex-col h-screen text-zinc-900 font-sans selection:bg-zinc-200 overflow-hidden relative">

                    {/* Blocking Modal */}
                    {blockingEscalation && (
                        <CodraEscalationModal
                            escalation={blockingEscalation}
                            onConfirm={() => handleResolveEscalation(blockingEscalation.id, true)}
                            onCancel={() => handleResolveEscalation(blockingEscalation.id, false)}
                        />
                    )}

                    {/* Workspace Header */}
                    <WorkspaceHeader
                        mode="canvas"
                        projectName={project.name}
                        projectId={projectId || ''}
                        statusLabel={executionState}
                        leftDockVisible={layout.leftDockVisible}
                        rightDockVisible={layout.rightDockVisible}
                        onToggleLeftDock={() => toggleDock('left')}
                        onToggleRightDock={() => toggleDock('right')}
                        onOpenSettings={() => {
                            setSettingsScope(activeTaskId ? 'task' : 'project');
                            setIsSettingsOpen(true);
                        }}
                        onOpenExport={() => setIsExportModalOpen(true)}
                        onToggleActivity={() => setIsActivityOpen(prev => !prev)}
                        onOpenAssets={() => setIsAssetsOpen(true)}
                        onOpenLyra={() => lyra?.show?.()}
                        contextMemory={{
                            percentage: usageStats.percentage,
                            level: usageStats.level,
                        }}
                    />

                    {/* Main Workspace */}
                        <main className="flex-1 flex overflow-hidden relative">
                        {/* Left Rail: Lyra + Context */}
                            {layout.leftDockVisible && (
                                <aside
                                    className="h-full border-r border-[var(--color-border)] bg-[var(--color-ivory)]/20 shrink-0 relative flex flex-col"
                                    style={{ width: layout.leftDockWidth }}
                                >
                                <div className="flex-1 min-h-0">
                                    <LyraPanel
                                        spreadId={spread?.id}
                                        deskId={activeTask?.deskId}
                                    />
                                </div>
                                <div className="px-[var(--space-lg)] py-[var(--space-md)] border-t border-[var(--ui-border)]/70">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-text-soft uppercase tracking-wider">Context</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsContextModalOpen(true)}
                                            className="text-xs text-text-soft hover:text-text-primary"
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                    {hasContextSummary ? (
                                        <p className="mt-[var(--space-xs)] text-sm text-text-primary/80 leading-relaxed">
                                            {contextSummary}
                                        </p>
                                    ) : (
                                        <p className="mt-[var(--space-xs)] text-xs text-text-soft">
                                            Add a summary so runs stay grounded.
                                        </p>
                                    )}
                                    {hasContextDetails && (
                                        <Button
                                            onClick={() => setIsContextExpanded(prev => !prev)}
                                            className="mt-[var(--space-sm)] flex items-center gap-1 px-2 py-1 rounded-md text-text-soft hover:text-text-primary hover:bg-zinc-100 transition-all"
                                            aria-expanded={isContextExpanded}
                                            aria-label="Toggle context details"
                                        >
                                            <span className="text-xs font-semibold">Details</span>
                                            <ChevronDown
                                                size={12}
                                                className={cn("transition-transform", isContextExpanded && "rotate-180")}
                                            />
                                        </Button>
                                    )}
                                    {hasContextSummary && isContextExpanded && (
                                        <div className="mt-[var(--space-sm)] text-xs text-text-soft space-y-[var(--space-xs)]">
                                            <div>
                                                <span className="text-zinc-400">Audience:</span>{' '}
                                                {currentRevision?.data?.audience?.primary || 'Not set'}
                                            </div>
                                            <div>
                                                <span className="text-zinc-400">Status:</span>{' '}
                                                {currentRevision?.status || 'Draft'}
                                            </div>
                                            <Link
                                                to={`/p/${projectId}/context`}
                                                className="inline-flex items-center gap-[var(--space-xs)] text-[10px] text-zinc-400 hover:text-zinc-600 hover:underline"
                                            >
                                                View version history →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-zinc-300/40 transition-colors"
                                    onMouseDown={startResizing('left')}
                                />
                            </aside>
                        )}

                        {/* Center Canvas: Execution */}
                        <section className="flex-1 flex overflow-hidden">
                            {isIdle ? (
                                <main ref={mainRef} className="flex-1 relative bg-[var(--color-border-soft)] overflow-hidden flex flex-col">
                                    <div className="absolute inset-0 transition-all bg-white dark:bg-zinc-900" />
                                    <div className="relative flex-1 overflow-y-auto">
                                        <div className="page-container page-gutter">
                                                <div className="max-w-[900px] space-y-[var(--space-3xl)] border-b border-[var(--ui-border)]/70 py-[var(--space-2xl)]">
                                                    <div className="text-meta text-text-soft">{executionState}</div>
                                                    <PromptArchitectPanel variant="compact" />
                                                    <div className="space-y-[var(--space-3xl)]">
                                                        {hasOutputs && outputSections.length > 0 ? (
                                                            outputSections.map((section) => (
                                                                <SpreadSection
                                                                    key={section.id}
                                                                    section={section}
                                                                    isActive={section.id === activeSectionId}
                                                                    onUpdate={handleSectionUpdate}
                                                                />
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-text-soft">Outputs will appear here.</div>
                                                        )}
                                                    </div>
                                                </div>
                                        </div>
                                    </div>
                                </main>
                            ) : (
                                <>
                                    <aside className="w-[260px] border-r border-[var(--color-border)] bg-[var(--color-ivory)]/15 flex flex-col">
                                        <div className="flex border-0 border-b border-[var(--color-border-soft)] rounded-none bg-transparent sticky top-0 z-10">
                                            <Button
                                                onClick={() => setActiveLeftTab('toc')}
                                                className={cn(
                                                    "flex-1 py-3 text-[11px] font-semibold transition-all border-b-2",
                                                    activeLeftTab === 'toc'
                                                        ? "text-text-primary border-zinc-400"
                                                        : "text-text-soft border-transparent hover:text-text-primary"
                                                )}
                                            >
                                                Index
                                            </Button>
                                            <Button
                                                onClick={() => setActiveLeftTab('prompts')}
                                                className={cn(
                                                    "flex-1 py-3 text-[11px] font-semibold transition-all border-b-2",
                                                    activeLeftTab === 'prompts'
                                                        ? "text-text-primary border-zinc-400"
                                                        : "text-text-soft border-transparent hover:text-text-primary"
                                                )}
                                            >
                                                AI tasks
                                            </Button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto">
                                            <AnimatePresence mode="wait">
                                                {activeLeftTab === 'toc' ? (
                                                    <motion.div
                                                        key="toc"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="h-full"
                                                    >
                                                        <TOCSidebar
                                                            entries={spread?.toc as any || []}
                                                            activeSectionId={activeSectionId}
                                                            onNavigate={handleNavigateToSection}
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="prompts"
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="h-full"
                                                    >
                                                        {taskQueue && (
                                                            <PromptBacklog
                                                                taskQueue={taskQueue}
                                                                activeTaskId={activeTaskId}
                                                                onSelectTask={handleTaskSelect}
                                                                executionMode={executionMode}
                                                                onExecutionModeChange={setExecutionMode}
                                                                taskRunModes={taskRunModes}
                                                                taskRunStates={taskRunStates}
                                                                onRunTask={handleRunTask}
                                                            />
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </aside>

                                    <main ref={mainRef} className="flex-1 relative bg-[var(--color-border-soft)] overflow-hidden flex flex-col">
                                        <div className="absolute inset-0 transition-all bg-white dark:bg-zinc-900" />

                                        <div className="relative flex-1 flex flex-col overflow-hidden">
                                            <CodraWorkspace
                                                mode={activeTaskId ? 'execute' : 'consult'}
                                                spread={spread}
                                                activeTask={activeTask}
                                                pastMemories={taskQueue?.tasks.filter(t => (t.status as string) === 'complete').map(t => ({ title: t.title, memory: t.memory || '' }))}
                                                executionMode={executionMode}
                                                onExecutionModeChange={setExecutionMode}
                                                taskRunStates={taskRunStates}
                                                onRunTask={handleRunTask}
                                                onCancel={() => setActiveTaskId(null)}
                                                deskModels={deskModels}
                                                onSetDeskModel={(deskId, modelId, providerId) => setDeskModels(prev => ({ ...prev, [deskId]: { modelId, providerId } }))}
                                                globalModelId={selectedModelId}
                                            >
                                                {hasOutputs && outputSections.length > 0 ? (
                                                    outputSections.map((section) => (
                                                        <SpreadSection
                                                            key={section.id}
                                                            section={section}
                                                            isActive={section.id === activeSectionId}
                                                            onUpdate={handleSectionUpdate}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-text-soft">Outputs will appear here.</div>
                                                )}
                                            </CodraWorkspace>
                                        </div>
                                    </main>
                                </>
                            )}
                        </section>

                        {/* Right Dock: Inspector & Architect */}
                        {layout.rightDockVisible && (
                            <aside
                                className="h-full border-l border-[var(--color-border)] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] shrink-0 relative flex flex-col z-20"
                                style={{ width: layout.rightDockWidth }}
                            >
                                <div
                                    className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-zinc-300/40 transition-colors z-30"
                                    onMouseDown={startResizing('right')}
                                />

                                <div className="flex flex-col h-full">
                                    {!isIdle && (
                                        <>
                                            {isStrategyOpen && (
                                                <div className="flex-1 overflow-y-auto border-b border-[var(--color-border-soft)]">
                                                    <PromptArchitectPanel />
                                                </div>
                                            )}

                                    <div className="px-[var(--space-md)] py-[var(--space-sm)] border-b border-[var(--color-border-soft)] flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsStrategyOpen(prev => !prev)}
                                            className="flex items-center gap-2 text-xs font-semibold text-text-soft hover:text-text-primary"
                                                    aria-expanded={isStrategyOpen}
                                                >
                                                    <span>Strategy</span>
                                                    <ChevronDown
                                                        size={12}
                                                        className={cn("transition-transform", isStrategyOpen && "rotate-180")}
                                                    />
                                                </Button>
                                            </div>
                                        </>
                                    )}

                                    <div className={cn("flex-1 overflow-hidden flex flex-col border-t border-[var(--ui-border)]/70", isStrategyOpen && "h-1/2")}>
                                        <OutputInspector
                                            spread={spread}
                                            onSectionUpdate={handleSectionUpdate}
                                            taskComplete={taskComplete}
                                            suggestedDeskId={suggestedDeskId}
                                            activeTask={activeTask}
                                            runMode={activeTask ? taskRunModes[activeTask.id] || executionMode : executionMode}
                                            runState={activeTask ? taskRunStates[activeTask.id] : undefined}
                                            onBatchCreateTasks={handleBatchCreateTasks}
                                            hasOutputs={hasOutputs}
                                        />
                                    </div>
                                </div>
                            </aside>
                        )}

                        {/* Task History Sidebar */}
                        <TaskHistorySidebar 
                            taskQueue={taskQueue}
                            isOpen={isHistoryOpen}
                            onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
                            onReplay={handleReplay}
                            onRemix={handleRemix}
                        />
                    </main>

                    {/* Bottom Activity Strip */}
                    {isActivityOpen && (
                        <ActivityStrip
                            completedTasks={taskQueue?.tasks.filter(t => (t.status as string) === 'complete').length || 0}
                            totalTasks={taskQueue?.tasks.length || 0}
                            budgetSpent={project?.budgetPolicy ? getBudgetSummary(project.id, project.budgetPolicy).spent : 0}
                            budgetLimit={project?.budgetPolicy?.dailyLimit || 0}
                            activeBottomPanel={activeBottomPanel}
                            onToggleBottomPanel={(panel) => setActiveBottomPanel(activeBottomPanel === panel ? null : panel)}
                            status="stable"
                        />
                    )}

                    {/* Bottom Panels Tray */}
                    {activeBottomPanel && (
                        <div
                            className="absolute inset-x-0 bottom-8 z-40 bg-white border-t border-zinc-200 shadow-2xl animate-in slide-in-from-bottom duration-300"
                            style={{ height: '60vh' }}
                        >
                            <div className="h-full flex flex-col">
                                <header className="h-10 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between px-[var(--space-xl)] shrink-0">
                                    <SectionHeader
                                        title={activeBottomPanel === 'git' ? 'Version control / GitHub' : 'Production / Cloud console'}
                                        className="mt-0 mb-0"
                                    />
                                    <Button
                                        onClick={() => setActiveBottomPanel(null)}
                                        className="p-1 hover:bg-zinc-200 rounded transition-colors"
                                    >
                                        <X size={14} className="text-zinc-500" />
                                    </Button>
                                </header>
                                <div className="flex-1 overflow-hidden">
                                    {activeBottomPanel === 'git' && <GitPanel />}
                                    {activeBottomPanel === 'deploy' && <DeployPanel />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Model Diagnostics Panel (Cmd/Ctrl+Shift+M) */}
                <ModelDiagnostics
                    isOpen={showModelDiagnostics}
                    onClose={() => setShowModelDiagnostics(false)}
                    currentTask={activeTaskId ? taskQueue?.tasks.find(t => t.id === activeTaskId)?.title : undefined}
                />

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    projectId={projectId || undefined}
                    taskId={activeTaskId || undefined}
                    defaultScope={settingsScope}
                    sessionSpend={sessionCost}
                    todaySpend={budgetSummary?.spent}
                />

                <ContextModal
                    isOpen={isContextModalOpen}
                    onClose={() => setIsContextModalOpen(false)}
                    projectId={projectId || undefined}
                />

                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    defaultScope="artifacts"
                    items={spread ? spread.sections.map((section) => ({
                        id: section.id,
                        title: section.title,
                        type: section.type,
                        content: section.content,
                    })) : []}
                    contextData={currentRevision?.data as Record<string, unknown> | undefined}
                    projectName={project?.name}
                />
                {isAssetsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-[var(--space-xl)] py-[var(--space-md)] border-b border-zinc-100">
                                <h2 className="text-sm font-semibold text-text-primary">Asset registry</h2>
                                <Button
                                    onClick={() => setIsAssetsOpen(false)}
                                    className="px-3 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary"
                                >
                                    Close
                                </Button>
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto">
                                <AssetRegistryPanel
                                    assets={assets || []}
                                    onUpload={async (files) => {
                                        toast.info(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);

                                        const { successes, errors } = await uploadAssets(
                                            files,
                                            projectId || '',
                                            (completed, total) => {
                                                console.log(`Uploaded ${completed}/${total}`);
                                            }
                                        );

                                        if (successes.length > 0) {
                                            setAssets(prev => [...(prev || []), ...successes]);
                                            toast.success(`${successes.length} asset${successes.length > 1 ? 's' : ''} uploaded`);
                                        }

                                        if (errors.length > 0) {
                                            toast.error(`${errors.length} upload${errors.length > 1 ? 's' : ''} failed`);
                                            console.error('Upload errors:', errors);
                                        }
                                    }}
                                    onDelete={(id) => setAssets(prev => (prev || []).filter(a => a.id !== id))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </LyraProvider>
        </ErrorBoundary>
    );
}
