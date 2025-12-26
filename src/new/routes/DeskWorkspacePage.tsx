import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutTemplate, Sparkles, Box, Code, FileText } from 'lucide-react';
import { PRODUCTION_DESKS } from '../../domain/types';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtDeskCanvas } from '../components/desks/ArtDeskCanvas';
import { EngineeringDeskCanvas } from '../components/desks/EngineeringDeskCanvas';
import { WritingDeskCanvas } from '../components/desks/WritingDeskCanvas';
import { WorkflowDeskCanvas } from '../components/desks/WorkflowDeskCanvas';
import { CollabPresenceLayer } from '../components/collab/CollabPresenceLayer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useToast } from '../components/Toast';

/**
 * DESK WORKSPACE PAGE
 * A specialized route for deep production work.
 * Higher fidelity than the general Spread view.
 */
export const DeskWorkspacePage: React.FC = () => {
    const { projectId, deskId } = useParams<{ projectId: string; deskId: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [leftPanelVisible, setLeftPanelVisible] = useState(true);
    const [rightPanelVisible, setRightPanelVisible] = useState(true);

    const { spread, loading } = useSupabaseSpread(projectId);

    const desk = PRODUCTION_DESKS.find(d => d.id === deskId);

    if (loading) {
        return (
            <div className="h-screen bg-[var(--desk-bg)] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[var(--desk-text-muted)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                    Opening {desk?.label || deskId} Workspace...
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[var(--desk-bg)] flex flex-col text-[var(--desk-text-primary)] selection:bg-rose-500/30 overflow-hidden">
            {/* Desk Header */}
            <header className="h-14 border-b border-[var(--desk-border)] flex items-center justify-between px-6 bg-[var(--desk-surface)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/p/${projectId}/spread`)}
                        className="p-2 hover:bg-[var(--desk-bg)] rounded-lg transition-colors text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)]"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="w-px h-6 bg-[var(--desk-border)]" />

                    <div className="flex items-center gap-3">
                        <motion.div
                            key={deskId}
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="p-2 bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20"
                        >
                            {deskId === 'art-design' && <Box size={18} />}
                            {deskId === 'engineering' && <Code size={18} />}
                            {deskId === 'writing' && <FileText size={18} />}
                            {deskId === 'workflow' && <LayoutTemplate size={18} />}
                        </motion.div>
                        <div>
                            <h1 className="text-sm font-bold uppercase tracking-tight text-[var(--desk-text-primary)]">{desk?.label} Workspace</h1>
                            <p className="text-[10px] text-[var(--desk-text-muted)] font-mono uppercase tracking-[0.2em]">{spread?.projectId || projectId}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            setLeftPanelVisible(!leftPanelVisible);
                            setRightPanelVisible(!rightPanelVisible);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--desk-surface)] hover:bg-[var(--desk-bg)] rounded-lg text-xs font-bold transition-all border border-[var(--desk-border)] text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)]"
                    >
                        <LayoutTemplate size={14} />
                        Toggle Panels
                    </button>
                    <button 
                        onClick={() => toast.info('Lyra Insight Panel initializing...')}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                    >
                        <Sparkles size={14} />
                        Launch Lyra
                    </button>
                </div>
            </header>

            <CollabPresenceLayer>
                <main className="flex-1 overflow-hidden flex">
                    {/* ... rest of the main content ... */}
                    {/* I'll use a better way to replace the entire main block to avoid mistakes */}
                    {/* Left: Context / Parameters */}
                    <AnimatePresence>
                        {leftPanelVisible && (
                            <motion.aside
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-80 border-r border-[var(--desk-border)] bg-[var(--desk-bg)]/30 backdrop-blur-sm shrink-0 p-6 flex flex-col gap-8"
                            >
                                <section>
                                    <h3 className="text-[10px] text-[var(--desk-text-muted)] font-bold uppercase tracking-widest mb-4">Production Context</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-[var(--desk-surface)] border border-[var(--desk-border)] space-y-2 shadow-sm">
                                            <p className="text-[10px] font-mono text-rose-500 uppercase tracking-wider">Active Memory</p>
                                            <p className="text-xs text-[var(--desk-text-primary)] leading-relaxed italic">"Editorial high-contrast mono with Bauhaus accents."</p>
                                        </div>
                                    </div>
                                </section>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Center: Desk Specific Canvas */}
                    <div className="flex-1 bg-[var(--desk-bg)] relative overflow-hidden p-12 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={deskId}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                                transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <ErrorBoundary name={desk?.label || deskId}>
                                    {deskId === 'art-design' && <ArtDeskCanvas />}
                                    {deskId === 'engineering' && <EngineeringDeskCanvas />}
                                    {deskId === 'writing' && <WritingDeskCanvas />}
                                    {deskId === 'workflow' && <WorkflowDeskCanvas />}
                                </ErrorBoundary>

                                {!['art-design', 'engineering', 'writing', 'workflow'].includes(deskId || '') && (
                                    <div className="max-w-4xl w-full h-full rounded-3xl border-2 border-dashed border-[var(--desk-border)] flex flex-col items-center justify-center text-center gap-4 group hover:border-[var(--desk-text-primary)]/20 transition-colors">
                                        <div className="p-6 rounded-full bg-[var(--desk-surface)] group-hover:bg-[var(--desk-bg)] transition-colors shadow-lg">
                                            <Sparkles className="text-rose-500 animate-pulse" size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold tracking-tight text-[var(--desk-text-primary)]">The {desk?.label} Canvas is Ready</h2>
                                            <p className="text-sm text-[var(--desk-text-muted)] max-w-sm">Deep work tools for {deskId} are initializing. Lyra is scanning your project memories to prepare the environment.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right: Lyra Desk Assistant */}
                    <AnimatePresence>
                        {rightPanelVisible && (
                            <motion.aside 
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-96 border-l border-[var(--desk-border)] bg-[var(--desk-bg)]/30 backdrop-blur-sm shrink-0 p-6"
                            >
                                <div className="h-full flex flex-col rounded-2xl border border-[var(--desk-border)] bg-[var(--desk-surface)]/50 shadow-xl overflow-hidden">
                                    <header className="p-4 border-b border-[var(--desk-border)] flex items-center justify-between bg-[var(--desk-surface)]/80">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--desk-text-muted)]">Lyra Assistant</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                            <span className="text-[8px] font-mono uppercase text-[var(--desk-text-muted)] tracking-wider">Online</span>
                                        </div>
                                    </header>

                                    <div className="flex-1 p-4 flex flex-col justify-end">
                                        <div className="p-3 bg-[var(--desk-bg)]/50 rounded-2xl rounded-bl-sm border border-[var(--desk-border)] max-w-[85%] self-start mb-4 shadow-sm">
                                            <p className="text-xs text-[var(--desk-text-primary)] leading-relaxed">
                                                I've prepared the {desk?.label} workspace based on your editorial brief. Ready to start generating assets or exploring code?
                                            </p>
                                        </div>
                                        <div className="relative mt-4">
                                            <input
                                                type="text"
                                                placeholder="Brief Lyra for this Desk..."
                                                className="w-full bg-[var(--desk-bg)]/40 border border-[var(--desk-border)] rounded-xl px-4 py-3 text-xs placeholder:text-[var(--desk-text-muted)] focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all font-mono text-[var(--desk-text-primary)]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>
            </CollabPresenceLayer>
        </div>
    );
};
