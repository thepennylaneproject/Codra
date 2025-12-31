import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ProductionDeskId } from '../../domain/types';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { motion, AnimatePresence } from 'framer-motion';
import { CollabPresenceLayer } from '../components/collab/CollabPresenceLayer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { WorkspaceHeader } from '../components/shell/WorkspaceHeader';
import { useFlowStore } from '../../lib/store/useFlowStore';
import { getProjectById } from '../../domain/projects';
import { Project } from '../../domain/types';
import { LyraAssistant } from '../../components/codra/LyraAssistant';
import { DeskSwitcher } from '../components/desks/DeskSwitcher';
import { DeskCanvas } from '../components/desks/DeskCanvas';
import { useDeskSwitching } from '../components/desks/hooks/useDeskSwitching';

/**
 * DESK WORKSPACE PAGE
 * A specialized route for deep production work.
 * Higher fidelity than the general Spread view.
 * Now unified into a single route with view switching via query params.
 */
export const DeskWorkspacePage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { activeDesk, switchDesk } = useDeskSwitching(projectId!);

    const { 
        layout, 
        toggleDock, 
    } = useFlowStore();

    const [project, setProject] = useState<Project | null>(null);
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const { loading } = useSupabaseSpread(projectId);
    
    // Load project data
    React.useEffect(() => {
        if (projectId) {
            getProjectById(projectId).then(setProject);
        }
    }, [projectId]);

    const activeDeskTint = `var(--desk-${activeDesk}-tint)`;

    if (loading) {
        return (
            <div className="h-screen bg-[var(--desk-bg)] flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[var(--desk-text-muted)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--brand-teal)]/20 border-t-[var(--brand-teal)] animate-spin" />
                    Opening Workspace...
                </motion.div>
            </div>
        );
    }

    return (
        <div 
            className="h-screen bg-[var(--desk-bg)] flex flex-col text-[var(--desk-text-primary)] selection:bg-[var(--brand-teal)]/30 overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: activeDeskTint ? `color-mix(in srgb, var(--desk-bg), ${activeDeskTint} 10%)` : 'var(--desk-bg)' }}
        >
            {/* Unified Workspace Header */}
            <WorkspaceHeader
                mode="studio"
                activeStudioId={activeDesk}
                projectName={project?.name || 'Loading...'}
                projectId={projectId || ''}
                leftDockVisible={layout.leftDockVisible}
                rightDockVisible={layout.rightDockVisible}
                onToggleLeftDock={() => toggleDock('left')}
                onToggleRightDock={() => toggleDock('right')}
            />

            {/* Desk Switcher Tabs */}
            <DeskSwitcher activeDesk={activeDesk} onSwitch={switchDesk} />

            <CollabPresenceLayer>
                <main className="flex-1 overflow-hidden flex">
                    {/* Left: Project Context */}
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
                    <div className="flex-1 bg-transparent relative overflow-hidden flex items-center justify-center">
                        <ErrorBoundary name={activeDesk}>
                            <DeskCanvas activeDesk={activeDesk} projectId={projectId!} />
                        </ErrorBoundary>
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
                                <LyraAssistant
                                    currentPrompt={currentPrompt}
                                    project={project}
                                    onPromptRefined={(refined) => setCurrentPrompt(refined)}
                                />
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>
            </CollabPresenceLayer>
        </div>
    );
};
