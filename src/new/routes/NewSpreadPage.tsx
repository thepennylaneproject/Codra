import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Project, Spread, CodraEscalation, Asset } from '../../domain/types';
import { generateSpreadFromProfile } from '../../domain/spread/engine';
import { ModelSelector } from '../components/ModelSelector';
import { useProviderRegistry } from '../../lib/ai/registry/useProviderRegistry';
import { ExtendedOnboardingProfile } from '../../domain/onboarding-types';
import { getProjectById } from '../../domain/projects';
import { X } from 'lucide-react';
import { CodraEscalationModal } from '../components/CodraEscalation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { TOCSidebar } from '../components/TOCSidebar';
import { selectModelForTask } from '../../domain/model-selector';
import { LyraProvider } from '../../lib/lyra';
import { TaskExecutor } from '../../lib/ai/execution/task-executor';

// Task Queue imports
import { SpreadTask, TaskQueue } from '../../domain/task-queue';
import { generateTaskQueue, updateTaskStatus } from '../../domain/spread/task-queue-engine';
import { generatePromptForTask, buildPromptContext, PromptContext } from '../../lib/lyra/LyraPromptEngine';
import { checkGuardrails, shouldEscalate, createEscalation, getBudgetSummary, getTodaysBudget } from '../../lib/codra/codra-guardrails';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { PromptBacklog } from '../components/PromptBacklog';
import { OutputInspector } from '../components/OutputInspector';
import { GitPanel } from '../components/panels/git/GitPanel';
import { DeployPanel } from '../components/panels/deploy/DeployPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useToast } from '../components/Toast';

// Shell Components
import { WorkspaceHeader } from '../components/shell/WorkspaceHeader';
import { ActivityStrip } from '../components/shell/ActivityStrip';
import { CodraWorkspace } from '../components/CodraWorkspace';
import { PromptArchitectPanel } from '../components/panels/PromptArchitectPanel';
import { AssetRegistryPanel } from '../components/panels/AssetRegistryPanel';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { uploadAssets } from '../../lib/assets/upload';
import { useProjectMemory } from '../../lib/memory/useProjectMemory';

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
        addToSessionCost
    } = useFlowStore();

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
    const [activeRightPanel, setActiveRightPanel] = useState<'architect' | 'assets'>('architect');
    const [assets, setAssets] = useState<Asset[]>([]);

    // AI Model Selection
    const { providers } = useProviderRegistry();
    const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
    const [selectedProviderId, setSelectedProviderId] = useState('openai');

    // Task Executor
    const [taskExecutor] = useState(() => new TaskExecutor());

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

    // Handle TOC navigation
    const handleNavigateToSection = (sectionId: string) => {
        // Handle Production Desk navigation
        if (sectionId.startsWith('desk-')) {
            const deskId = sectionId.replace('desk-', '');
            navigate(`/p/${projectId}/desk/${deskId}`);
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
        const promptContext: PromptContext = buildPromptContext(spread, extendedProfile || undefined as any, activeSectionId || undefined, taskQueue.tasks);

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

    const handleRunTask = useCallback(async (taskId: string) => {
        if (!taskQueue || !spread || !project) return;

        const task = taskQueue.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Validate task
        const validation = taskExecutor.validateTask(task);
        if (!validation.valid) {
            console.error('[Task Validation Failed]', validation.error);
            // TODO: Show toast notification
            return;
        }

        setExecutingTaskId(taskId);

        // Set to in-progress
        let updatedQueue = updateTaskStatus(taskQueue, taskId, 'in-progress');
        setTaskQueue(updatedQueue);
        persistTaskQueue(updatedQueue);

        try {
            // Build prompt context
            const promptContext = buildPromptContext(
                spread,
                extendedProfile || undefined as any,
                activeSectionId || undefined,
                taskQueue.tasks
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
            persistTaskQueue(updatedQueue);

            // Track session cost
            addToSessionCost(result.cost);

            console.log(
                `[AI Task Complete] ${result.modelUsed} | ${result.tokensUsed} tokens | $${result.cost.toFixed(4)} | ${result.durationMs}ms`
            );

            // Success feedback
            toast.success(`"${task.title}" completed • ${result.tokensUsed} tokens`);
        } catch (error) {
            console.error('[AI Task Execution Failed]', error);

            // Revert to pending
            updatedQueue = updateTaskStatus(taskQueue, taskId, 'pending');
            setTaskQueue(updatedQueue);
            persistTaskQueue(updatedQueue);

            // Error feedback with longer duration
            toast.error(`Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 8000);
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
    ]);

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

    if (!project) {
        return <div className="h-screen bg-[#FFFAF0] text-[#1A1A1A]/40 flex items-center justify-center font-mono uppercase tracking-[0.2em] animate-pulse">Reviewing Spread...</div>;
    }

    const blockingEscalation = escalations.find(e => e.severity === 'blocking' && !e.resolved);

    return (
        <ErrorBoundary name="Active Workspace">
            <LyraProvider>
                <div className="flex flex-col h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-rose-200 overflow-hidden relative">

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
                        projectName={project.name}
                        projectId={projectId || ''}
                        leftDockVisible={layout.leftDockVisible}
                        rightDockVisible={layout.rightDockVisible}
                        onToggleLeftDock={() => toggleDock('left')}
                        onToggleRightDock={() => toggleDock('right')}
                        contextMemory={{
                            percentage: usageStats.percentage,
                            level: usageStats.level,
                        }}
                    />

                    {/* Main Workspace */}
                    <main className="flex-1 flex overflow-hidden relative">
                        {/* Left Dock: Tools & Prompts */}
                        {layout.leftDockVisible && (
                            <aside
                                className="h-full border-r border-[#1A1A1A]/10 bg-[#FFFAF0]/30 shrink-0 relative flex flex-col"
                                style={{ width: layout.leftDockWidth }}
                            >
                                {/* Tab Switcher */}
                                <div className="flex border-b border-[#1A1A1A]/5 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                    <button
                                        onClick={() => setActiveLeftTab('toc')}
                                        className={cn(
                                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                                            activeLeftTab === 'toc'
                                                ? "text-[#1A1A1A] border-[#FF4D4D]"
                                                : "text-[#8A8A8A] border-transparent hover:text-[#1A1A1A]"
                                        )}
                                    >
                                        Sections
                                    </button>
                                    <button
                                        onClick={() => setActiveLeftTab('prompts')}
                                        className={cn(
                                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                                            activeLeftTab === 'prompts'
                                                ? "text-[#1A1A1A] border-[#FF4D4D]"
                                                : "text-[#8A8A8A] border-transparent hover:text-[#1A1A1A]"
                                        )}
                                    >
                                        AI Tasks
                                    </button>
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
                                                <div className="p-4 border-b border-[#1A1A1A]/5">
                                                    <ModelSelector
                                                        selectedModelId={selectedModelId}
                                                        onSelectModel={(mId, pId) => {
                                                            setSelectedModelId(mId);
                                                            setSelectedProviderId(pId);
                                                        }}
                                                        isSmartMode={project?.aiPreferences?.smartMode !== false}
                                                    />
                                                </div>
                                                {taskQueue && (
                                                    <PromptBacklog
                                                        taskQueue={taskQueue}
                                                        activeTaskId={activeTaskId}
                                                        onSelectTask={handleTaskSelect}
                                                        onRunTask={handleRunTask}
                                                    />
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div
                                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-[#FF4D4D]/20 transition-colors"
                                    onMouseDown={startResizing('left')}
                                />
                            </aside>
                        )}

                        {/* Editor Canvas */}
                        <main ref={mainRef} className="flex-1 relative bg-[#1A1A1A]/5 overflow-hidden flex flex-col">
                            <div className="absolute inset-0 transition-all bg-white dark:bg-zinc-900" />

                            <div className="relative flex-1 flex flex-col overflow-hidden">
                                <CodraWorkspace
                                    mode={activeTaskId ? 'execute' : 'consult'}
                                    spread={spread}
                                    projectName={project.name}
                                    activeTask={taskQueue?.tasks.find(t => t.id === activeTaskId) || null}
                                    pastMemories={taskQueue?.tasks.filter(t => (t.status as string) === 'complete').map(t => ({ title: t.title, memory: t.memory || '' }))}
                                    onRunTask={handleRunTask}
                                    onSectionUpdate={handleSectionUpdate}
                                    deskModels={deskModels}
                                    onSetDeskModel={(deskId, modelId, providerId) => setDeskModels(prev => ({ ...prev, [deskId]: { modelId, providerId } }))}
                                    globalModelId={selectedModelId}
                                />
                            </div>
                        </main>

                        {/* Right Dock: Inspector & Architect */}
                        {layout.rightDockVisible && (
                            <aside
                                className="h-full border-l border-[#1A1A1A]/10 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] shrink-0 relative flex flex-col z-20"
                                style={{ width: layout.rightDockWidth }}
                            >
                                <div
                                    className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-[#FF4D4D]/20 transition-colors z-30"
                                    onMouseDown={startResizing('right')}
                                />

                                <div className="flex border-b border-[#1A1A1A]/5 bg-[#FFFAF0]/30">
                                    <button
                                        onClick={() => setActiveRightPanel('architect')}
                                        className={cn(
                                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                                            activeRightPanel === 'architect'
                                                ? "text-[#1A1A1A] border-[#FF4D4D]"
                                                : "text-[#8A8A8A] border-transparent hover:text-[#1A1A1A]"
                                        )}
                                    >
                                        Architect
                                    </button>
                                    <button
                                        onClick={() => setActiveRightPanel('assets')}
                                        className={cn(
                                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                                            activeRightPanel === 'assets'
                                                ? "text-[#1A1A1A] border-[#FF4D4D]"
                                                : "text-[#8A8A8A] border-transparent hover:text-[#1A1A1A]"
                                        )}
                                    >
                                        Assets
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {activeRightPanel === 'architect' && <PromptArchitectPanel />}
                                    {activeRightPanel === 'assets' && (
                                        <AssetRegistryPanel
                                            assets={assets || []}
                                            onUpload={async (files) => {
                                                toast.info(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);
                                                
                                                const { successes, errors } = await uploadAssets(
                                                    files,
                                                    projectId || '',
                                                    (completed, total) => {
                                                        // Progress tracking could update UI
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
                                    )}
                                </div>

                                <div className="h-1/2 border-t border-[#1A1A1A]/10 overflow-hidden flex flex-col">
                                    <OutputInspector
                                        spread={spread}
                                        onSectionUpdate={handleSectionUpdate}
                                    />
                                </div>
                            </aside>
                        )}
                    </main>

                    {/* Bottom Activity Strip */}
                    <ActivityStrip
                        completedTasks={taskQueue?.tasks.filter(t => (t.status as string) === 'complete').length || 0}
                        totalTasks={taskQueue?.tasks.length || 0}
                        budgetSpent={project?.budgetPolicy ? getBudgetSummary(project.id, project.budgetPolicy).spent : 0}
                        budgetLimit={project?.budgetPolicy?.dailyLimit || 0}
                        activeBottomPanel={activeBottomPanel}
                        onToggleBottomPanel={(panel) => setActiveBottomPanel(activeBottomPanel === panel ? null : panel)}
                        status="stable"
                    />

                    {/* Bottom Panels Tray */}
                    {activeBottomPanel && (
                        <div
                            className="absolute inset-x-0 bottom-10 z-40 bg-white border-t border-zinc-200 shadow-2xl animate-in slide-in-from-bottom duration-300"
                            style={{ height: '60vh' }}
                        >
                            <div className="h-full flex flex-col">
                                <header className="h-10 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between px-6 shrink-0">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {activeBottomPanel === 'git' ? 'Version Control / GitHub' : 'Production / Cloud Console'}
                                    </h2>
                                    <button
                                        onClick={() => setActiveBottomPanel(null)}
                                        className="p-1 hover:bg-zinc-200 rounded transition-colors"
                                    >
                                        <X size={14} className="text-zinc-500" />
                                    </button>
                                </header>
                                <div className="flex-1 overflow-hidden">
                                    {activeBottomPanel === 'git' && <GitPanel />}
                                    {activeBottomPanel === 'deploy' && <DeployPanel />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </LyraProvider>
        </ErrorBoundary>
    );
}
