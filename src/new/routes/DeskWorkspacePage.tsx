import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { PRODUCTION_DESKS } from '../../domain/types';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { motion, AnimatePresence } from 'framer-motion';
import { ArtDeskCanvas } from '../components/desks/ArtDeskCanvas';
import { EngineeringDeskCanvas } from '../components/desks/EngineeringDeskCanvas';
import { WritingDeskCanvas } from '../components/desks/WritingDeskCanvas';
import { WorkflowDeskCanvas } from '../components/desks/WorkflowDeskCanvas';
import { CollabPresenceLayer } from '../components/collab/CollabPresenceLayer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { WorkspaceHeader } from '../components/shell/WorkspaceHeader';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { getProjectById } from '../../domain/projects';
import { Project } from '../../domain/types';

/**
 * DESK WORKSPACE PAGE
 * A specialized route for deep production work.
 * Higher fidelity than the general Spread view.
 */
export const DeskWorkspacePage: React.FC = () => {
    const { projectId, deskId } = useParams<{ projectId: string; deskId: string }>();

    const { 
        layout, 
        toggleDock, 
    } = useFlowStore();

    const [project, setProject] = useState<Project | null>(null);
    const { loading } = useSupabaseSpread(projectId);
    
    // Load project data
    React.useEffect(() => {
        if (projectId) {
            getProjectById(projectId).then(setProject);
        }
    }, [projectId]);

    const desk = PRODUCTION_DESKS.find(d => d.id === deskId);

    if (loading) {
        return (
            <div className="h-screen bg-[var(--desk-bg)] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[var(--desk-text-muted)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--brand-teal)]/20 border-t-[var(--brand-teal)] animate-spin" />
                    Opening {desk?.label || deskId} Workspace...
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[var(--desk-bg)] flex flex-col text-[var(--desk-text-primary)] selection:bg-[var(--brand-teal)]/30 overflow-hidden">
            {/* Unified Workspace Header */}
            <WorkspaceHeader
                projectName={project?.name || 'Loading...'}
                projectId={projectId || ''}
                leftDockVisible={layout.leftDockVisible}
                rightDockVisible={layout.rightDockVisible}
                onToggleLeftDock={() => toggleDock('left')}
                onToggleRightDock={() => toggleDock('right')}
            />

            <CollabPresenceLayer>
                <main className="flex-1 overflow-hidden flex">
                    {/* ... rest of the main content ... */}
                    {/* I'll use a better way to replace the entire main block to avoid mistakes */}
                    {/* Left: Context / Parameters */}
                    <AnimatePresence>
                        {layout.leftDockVisible && (
                            <motion.aside
                                initial={{ x: -layout.leftDockWidth, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -layout.leftDockWidth, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-r border-[var(--desk-border)] bg-[var(--desk-bg)]/30 backdrop-blur-sm shrink-0 p-6 flex flex-col gap-8"
                                style={{ width: layout.leftDockWidth }}
                            >
                                <section>
                                    <h3 className="text-[10px] text-[var(--desk-text-muted)] font-bold uppercase tracking-widest mb-4">Production Context</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-[var(--desk-surface)] border border-[var(--desk-border)] space-y-2 shadow-sm">
                                            <p className="text-[10px] font-mono text-[var(--brand-teal)] uppercase tracking-wider">Active Memory</p>
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
                                    <div className="max-w-4xl w-full h-full rounded-xl border-2 border-dashed border-[var(--desk-border)] flex flex-col items-center justify-center text-center gap-4 group hover:border-[var(--desk-text-primary)]/20 transition-colors">
                                        <div className="p-6 rounded-full bg-[var(--desk-surface)] group-hover:bg-[var(--desk-bg)] transition-colors shadow-lg">
                                            <Sparkles className="text-[var(--brand-teal)] animate-pulse" size={32} />
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
                        {layout.rightDockVisible && (
                            <motion.aside 
                                initial={{ x: layout.rightDockWidth, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: layout.rightDockWidth, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-l border-[var(--desk-border)] bg-[var(--desk-bg)]/30 backdrop-blur-sm shrink-0 p-6"
                                style={{ width: layout.rightDockWidth }}
                            >
                                <div className="h-full flex flex-col rounded-xl border border-[var(--desk-border)] bg-[var(--desk-surface)]/50 shadow-xl overflow-hidden">
                                    <header className="p-4 border-b border-[var(--desk-border)] flex items-center justify-between bg-[var(--desk-surface)]/80">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--desk-text-muted)]">Lyra Assistant</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                                            <span className="text-[8px] font-mono uppercase text-[var(--desk-text-muted)] tracking-wider">Online</span>
                                        </div>
                                    </header>

                                    <div className="flex-1 p-4 flex flex-col justify-end">
                                        <div className="p-3 bg-[var(--desk-bg)]/50 rounded-xl rounded-bl-sm border border-[var(--desk-border)] max-w-[85%] self-start mb-4 shadow-sm">
                                            <p className="text-xs text-[var(--desk-text-primary)] leading-relaxed">
                                                I've prepared the {desk?.label} workspace based on your editorial brief. Ready to start generating assets or exploring code?
                                            </p>
                                        </div>
                                        <div className="relative mt-4">
                                            <input
                                                type="text"
                                                placeholder="Brief Lyra for this Desk..."
                                                className="w-full bg-[var(--desk-bg)]/40 border border-[var(--desk-border)] rounded-xl px-4 py-3 text-xs placeholder:text-[var(--desk-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-teal)]/50 transition-all font-mono text-[var(--desk-text-primary)]"
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
