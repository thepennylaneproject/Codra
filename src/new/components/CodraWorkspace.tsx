/**
 * CODRA WORKSPACE
 * src/new/components/CodraWorkspace.tsx
 * 
 * The unified canvas for the Editorial pipeline.
 * Seemlessly transitions between "Consult" (Tear Sheet/Spread View)
 * and "Execute" (Task Production) modes.
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Terminal,
    Play,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { Spread } from '../../domain/types';
import { SpreadTask } from '../../domain/task-queue';
import { ExecutionMode } from '@/lib/ai/execution/task-executor';
import { getPreviewGuardrail } from '@/lib/ai/execution/preview-guardrails';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DesignCanvas } from './desks/DesignCanvas';
import { CodeCanvas } from './desks/CodeCanvas';
import { WriteCanvas } from './desks/WriteCanvas';
import { AnalyzeCanvas } from './desks/AnalyzeCanvas';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CodraWorkspaceProps {
    mode: 'consult' | 'execute';
    spread: Spread | null;
    activeTask: SpreadTask | null;
    children?: ReactNode;
    pastMemories?: Array<{ title: string; memory: string }>;
    executionMode: ExecutionMode;
    onExecutionModeChange: (mode: ExecutionMode) => void;
    taskRunModes: Record<string, ExecutionMode>;
    taskRunStates: Record<string, 'running' | 'complete' | 'failed'>;
    onRunTask: (taskId: string, mode: ExecutionMode) => void;
    onCancel?: () => void;
    deskModels: Record<string, { modelId: string; providerId: string }>;
    onSetDeskModel: (deskId: string, modelId: string, providerId: string) => void;
    globalModelId: string;
}

export const CodraWorkspace: React.FC<CodraWorkspaceProps> = ({
    mode,
    spread,
    activeTask,
    pastMemories,
    children,
    executionMode,
    onExecutionModeChange,
    taskRunModes,
    taskRunStates,
    onRunTask,
    onCancel,
    deskModels,
    onSetDeskModel,
    globalModelId
}) => {
    const runMode = activeTask ? taskRunModes[activeTask.id] || executionMode : executionMode;
    const runState = activeTask ? taskRunStates[activeTask.id] : undefined;
    const derivedState = runState
        || (activeTask?.status === 'in-progress' ? 'running' : activeTask?.status === 'complete' ? 'complete' : undefined);
    const executionStatusLabel = activeTask
        ? getExecutionStatusLabel(derivedState, runMode)
        : '';
    const previewGuardrail = activeTask ? getPreviewGuardrail(activeTask) : { blocked: false, matches: [] };
    const previewBlocked = executionMode === 'preview' && previewGuardrail.blocked;

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* Mission Control Header (Photonic Glass) */}
            <AnimatePresence mode="wait">
                {mode === 'execute' && activeTask && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-4 inset-x-4 z-30 pointer-events-none"
                    >
                        <div className="glass-panel-light border-[#1A1A1A]/10 bg-[#FFFAF0]/80 rounded-2xl p-4 shadow-2xl shadow-[#1A1A1A]/5 flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-xl shadow-[#1A1A1A]/20">
                                    <Terminal size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xs font-semibold text-text-primary">
                                            Executing: {activeTask.title}
                                        </h2>
                                        {executionStatusLabel && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200/50 text-zinc-500">
                                                <div className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />
                                                <span className="text-xs font-semibold">{executionStatusLabel}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-text-soft font-semibold">
                                        <span>{activeTask.deskId}</span>
                                        <ChevronRight size={10} />
                                        <span className="text-text-primary/60 italic truncate max-w-[300px]">{activeTask.description}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
                                    <Button
                                        onClick={() => onExecutionModeChange('preview')}
                                        className={cn(
                                            "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                                            executionMode === 'preview'
                                                ? "bg-white text-rose-500 shadow-sm"
                                                : "text-zinc-500"
                                        )}
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        onClick={() => onExecutionModeChange('execute')}
                                        className={cn(
                                            "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                                            executionMode === 'execute'
                                                ? "bg-white text-rose-500 shadow-sm"
                                                : "text-zinc-500"
                                        )}
                                    >
                                        Execute
                                    </Button>
                                </div>
                                {activeTask.status !== 'complete' && (
                                    <Button
                                        disabled={previewBlocked}
                                        onClick={() => onRunTask(activeTask.id, executionMode)}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-xs transition-all shadow-xl active:scale-95",
                                            previewBlocked
                                                ? "bg-zinc-200 text-zinc-500"
                                                : "bg-zinc-900 hover:bg-zinc-700 text-white"
                                        )}
                                    >
                                        <Play size={14} fill="currentColor" />
                                        {executionMode === 'preview' ? 'Run preview' : 'Execute workflow'}
                                    </Button>
                                )}
                                {activeTask.status === 'complete' && (
                                    <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl font-semibold text-xs">
                                        <CheckCircle2 size={14} />
                                        {executionStatusLabel}
                                    </div>
                                )}
                            </div>
                        </div>
                        {previewBlocked && (
                            <div className="mt-2 text-xs font-semibold text-zinc-500">
                                This workflow includes steps that cannot be previewed without side effects.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className={cn(
                    "max-w-[900px] mx-auto py-12 px-8 transition-all duration-700",
                    mode === 'execute' ? "opacity-40 scale-[0.98] blur-sm pointer-events-none" : "opacity-100 scale-100 blur-0"
                )}>
                    <div className="space-y-[var(--space-2xl)]">
                        {children}
                    </div>
                </div>

                {/* Execution Layer (Modal-ish overlay for task specific focus) */}
                <AnimatePresence>
                    {mode === 'execute' && activeTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex items-center justify-center p-8 glass-panel-light border-0 rounded-none bg-[var(--desk-bg)]/20"
                        >
                            <motion.div
                                initial={{ y: 20, scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                className="w-full max-w-4xl bg-[var(--desk-surface)] border border-[var(--desk-border)] rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col"
                            >
                                <div className="p-8 space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-text-soft">
                                            <Clock size={14} />
                                        <span className="text-xs font-semibold">Execution queue</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-text-primary">
                                            {activeTask.title}
                                        </h3>
                                    </div>

                                    {/* Desk Specific Canvas Injection */}
                                    <div className="flex-1 min-h-[500px] border-t border-b border-[var(--desk-border)] bg-[var(--desk-bg)]/5 -mx-8 px-8 py-8 overflow-y-auto custom-scrollbar">
                                        <ErrorBoundary name={activeTask.deskId}>
                                            {activeTask.deskId === 'design' && (
                                                <DesignCanvas
                                                    projectId={spread?.projectId || ''}
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m: string, p: string) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'code' && (
                                                <CodeCanvas
                                                    projectId={spread?.projectId || ''}
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m: string, p: string) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'write' && (
                                                <WriteCanvas
                                                    projectId={spread?.projectId || ''}
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m: string, p: string) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'analyze' && (
                                                <AnalyzeCanvas
                                                    projectId={spread?.projectId || ''}
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m: string, p: string) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                        </ErrorBoundary>
                                    </div>

                                    {pastMemories && pastMemories.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold text-text-soft">
                                                Contextual Injections ({pastMemories.length})
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {pastMemories.map((m, i) => (
                                                    <div key={i} className="p-3 bg-white border border-[#1A1A1A]/5 rounded-xl flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                                        <span className="text-xs font-semibold text-text-primary truncate">{m.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-8 py-6 bg-[var(--desk-bg)]/10 border-t border-[var(--desk-border)] flex items-center justify-between">
                                    <span className="text-xs font-semibold text-desk-text-muted">
                                        Est. Resolution: ~30s
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {onCancel && (
                                            <Button
                                                onClick={onCancel}
                                                className="px-6 py-3 text-xs font-semibold text-desk-text-muted hover:text-desk-text-primary hover:bg-[var(--desk-border)]/50 rounded-full transition-colors"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <Button
                                            disabled={previewBlocked}
                                            onClick={() => onRunTask(activeTask.id, executionMode)}
                                            className={cn(
                                                "px-8 py-3 rounded-full font-semibold text-xs shadow-xl transition-all active:scale-95",
                                                previewBlocked
                                                    ? "bg-zinc-200 text-zinc-500"
                                                    : "bg-[var(--desk-text-primary)] text-desk-surface hover:bg-zinc-600"
                                            )}
                                        >
                                            {executionMode === 'preview' ? 'Run preview' : 'Execute workflow'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

        </div>
    );
};

function getExecutionStatusLabel(status: 'running' | 'complete' | 'failed' | undefined, mode: ExecutionMode) {
    if (!status) return '';
    if (status === 'complete') return 'Complete';
    if (status === 'failed') return 'Failed';
    return 'Running';
}
