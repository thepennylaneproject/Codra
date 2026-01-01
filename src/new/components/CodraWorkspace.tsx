/**
 * CODRA WORKSPACE
 * src/new/components/CodraWorkspace.tsx
 * 
 * The unified canvas for the Editorial pipeline.
 * Seemlessly transitions between "Consult" (Tear Sheet/Spread View)
 * and "Execute" (Task Production) modes.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    ChevronRight,
    Terminal,
    Play,
    CheckCircle2,
    Clock,
    Layout
} from 'lucide-react';
import { Spread, SpreadSection as SpreadSectionType } from '../../domain/types';
import { SpreadTask } from '../../domain/task-queue';
import { SpreadSection } from './SpreadSection';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArtDeskCanvas } from './desks/ArtDeskCanvas';
import { EngineeringDeskCanvas } from './desks/EngineeringDeskCanvas';
import { WritingDeskCanvas } from './desks/WritingDeskCanvas';
import { WorkflowDeskCanvas } from './desks/WorkflowDeskCanvas';
import { MarketingDeskCanvas } from './desks/MarketingDeskCanvas';
import { CareerAssetsDeskCanvas } from './desks/CareerAssetsDeskCanvas';
import { DataAnalysisDeskCanvas } from './desks/DataAnalysisDeskCanvas';
import { ErrorBoundary } from './ErrorBoundary';
import { LyraNudgeContainer } from './LyraNudgeBubble';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CodraWorkspaceProps {
    mode: 'consult' | 'execute';
    spread: Spread | null;
    activeTask: SpreadTask | null;
    pastMemories?: Array<{ title: string; memory: string }>;
    onRunTask: (taskId: string) => void;
    onCancel?: () => void;
    onSectionUpdate: (sectionId: string, content: Record<string, any>) => void;
    deskModels: Record<string, { modelId: string; providerId: string }>;
    onSetDeskModel: (deskId: string, modelId: string, providerId: string) => void;
    globalModelId: string;
}

export const CodraWorkspace: React.FC<CodraWorkspaceProps> = ({
    mode,
    spread,
    activeTask,
    pastMemories,
    onRunTask,
    onCancel,
    onSectionUpdate,
    deskModels,
    onSetDeskModel,
    globalModelId
}) => {
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
                        <div className="bg-[#FFFAF0]/80 backdrop-blur-xl border border-[#1A1A1A]/10 rounded-2xl p-4 shadow-2xl shadow-[#1A1A1A]/5 flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-xl shadow-[#1A1A1A]/20">
                                    <Terminal size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#1A1A1A]">
                                            Executing: {activeTask.title}
                                        </h2>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF4D4D]/10 text-[#FF4D4D]">
                                            <div className="w-1 h-1 rounded-full bg-[#FF4D4D] animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">In Production</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#8A8A8A] font-bold uppercase tracking-wider">
                                        <span>{activeTask.deskId}</span>
                                        <ChevronRight size={10} />
                                        <span className="text-[#1A1A1A]/60 italic truncate max-w-[300px]">{activeTask.description}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTask.status !== 'complete' && (
                                    <button
                                        onClick={() => onRunTask(activeTask.id)}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#FF4D4D] text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95"
                                    >
                                        <Play size={14} fill="currentColor" />
                                        Launch Resolution
                                    </button>
                                )}
                                {activeTask.status === 'complete' && (
                                    <div className="flex items-center gap-2 px-6 py-2.5 bg-[#4BB543]/10 text-[#4BB543] rounded-xl font-black uppercase tracking-widest text-[10px]">
                                        <CheckCircle2 size={14} />
                                        Complete
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className={cn(
                    "max-w-4xl mx-auto py-24 px-8 transition-all duration-700",
                    mode === 'execute' ? "opacity-40 scale-[0.98] blur-sm pointer-events-none" : "opacity-100 scale-100 blur-0"
                )}>
                    {spread ? (
                        <div className="space-y-12">
                            {/* Workspace Header */}
                            <header className="mb-20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Layout size={16} className="text-[#8A8A8A]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8A8A]">
                                        Project Workspace
                                    </span>
                                </div>
                                <h1 className="text-5xl font-black text-[#1A1A1A] tracking-tighter leading-[0.9] mb-6">
                                    Project Overview
                                </h1>
                                <div className="w-20 h-1 bg-[#FF4D4D]" />
                            </header>

                            {/* Sections */}
                            <div className="space-y-16">
                                {spread.sections.map((section: SpreadSectionType) => (
                                    <SpreadSection
                                        key={section.id}
                                        section={section}
                                        onUpdate={onSectionUpdate}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                            <Sparkles className="text-[#FF4D4D] mb-6 animate-pulse" size={48} />
                            <h2 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-widest mb-2">
                                Initializing Canvas
                            </h2>
                            <p className="text-[#8A8A8A] text-sm italic">
                                Preparing your workspace...
                            </p>
                        </div>
                    )}
                </div>

                {/* Execution Layer (Modal-ish overlay for task specific focus) */}
                <AnimatePresence>
                    {mode === 'execute' && activeTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-[var(--desk-bg)]/20 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: 20, scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                className="w-full max-w-4xl bg-[var(--desk-surface)] border border-[var(--desk-border)] rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col"
                            >
                                <div className="p-10 space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[#8A8A8A]">
                                            <Clock size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Production Queue</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-[var(--desk-text-primary)] tracking-tight">
                                            {activeTask.title}
                                        </h3>
                                    </div>

                                    {/* Desk Specific Canvas Injection */}
                                    <div className="flex-1 min-h-[500px] border-t border-b border-[var(--desk-border)] bg-[var(--desk-bg)]/5 -mx-10 px-10 py-8 overflow-y-auto custom-scrollbar">
                                        <ErrorBoundary name={activeTask.deskId}>
                                            {activeTask.deskId === 'art-design' && (
                                                <ArtDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'engineering' && (
                                                <EngineeringDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'writing' && (
                                                <WritingDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'workflow' && (
                                                <WorkflowDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'marketing' && (
                                                <MarketingDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'career-assets' && (
                                                <CareerAssetsDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                            {activeTask.deskId === 'data-analysis' && (
                                                <DataAnalysisDeskCanvas
                                                    selectedModelId={deskModels[activeTask.deskId]?.modelId || globalModelId}
                                                    onSelectModel={(m, p) => onSetDeskModel(activeTask.deskId, m, p)}
                                                />
                                            )}
                                        </ErrorBoundary>
                                    </div>

                                    {pastMemories && pastMemories.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8A8A8A]">
                                                Contextual Injections ({pastMemories.length})
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {pastMemories.map((m, i) => (
                                                    <div key={i} className="p-3 bg-white border border-[#1A1A1A]/5 rounded-xl flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-[#FF4D4D]" />
                                                        <span className="text-[10px] font-bold text-[#1A1A1A] truncate">{m.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-10 py-6 bg-[var(--desk-bg)]/10 border-t border-[var(--desk-border)] flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[var(--desk-text-muted)] uppercase tracking-widest">
                                        Est. Resolution: ~30s
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={onCancel}
                                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] hover:bg-[var(--desk-border)]/50 rounded-full transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => onRunTask(activeTask.id)}
                                            className="px-8 py-3 bg-[var(--desk-text-primary)] text-[var(--desk-surface)] rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#FF4D4D] transition-all active:scale-95"
                                        >
                                            Begin Production
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Proactive Nudges */}
                <LyraNudgeContainer className="absolute bottom-6 right-6 z-50 pointer-events-auto" />
            </div>
        </div>
    );
};
