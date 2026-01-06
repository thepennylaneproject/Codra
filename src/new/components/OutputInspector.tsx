import { useState } from 'react';
import { Spread, ProductionDeskId } from '../../domain/types';
import { Code2, Image as ImageIcon, FileText, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { SpreadSection } from './SpreadSection';
import { ArtifactFeedbackBar } from './ArtifactFeedbackBar';
import { ExportModal } from '@/components/export/ExportModal';
import type { ExportItem } from '@/lib/export/generators';
import { EmptyState } from './EmptyState';
import { Button, IconButton } from '@/components/ui/Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SpreadTask } from '../../domain/task-queue';
import { ExecutionMode } from '@/lib/ai/execution/task-executor';
import { ApprovalButtons } from '@/components/inspector/ApprovalButtons';
import { SuggestionsModal } from '@/components/inspector/SuggestionsModal';
import { DeskSuggestion } from '@/lib/desk-suggestions';
import { useArtifactVersions } from '@/hooks/useArtifactVersions';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface OutputInspectorProps {
    spread: Spread | null;
    onSectionUpdate?: (sectionId: string, content: Record<string, unknown>) => void;
    taskComplete?: boolean;
    suggestedDeskId?: ProductionDeskId | null;
    activeTask?: SpreadTask | null;
    runMode?: ExecutionMode;
    runState?: 'running' | 'complete' | 'failed';
    onBatchCreateTasks?: (suggestions: DeskSuggestion[]) => Promise<void>;
    hasOutputs?: boolean;
}

type Tab = 'preview' | 'code' | 'assets';

export function OutputInspector({
    spread,
    onSectionUpdate,
    taskComplete,
    suggestedDeskId,
    activeTask,
    onBatchCreateTasks,
    hasOutputs
}: OutputInspectorProps) {
    const [activeTab, setActiveTab] = useState<Tab>('preview');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
    
    // Manage versions for approval
    const { versions, refresh: refreshVersions } = useArtifactVersions(activeTask?.artifactId || '');
    const latestVersion = versions[versions.length - 1];

    const showApproval = useFeatureFlag(FEATURE_FLAGS.ARTIFACT_APPROVAL_WORKFLOW);

    const showOutputs = Boolean(hasOutputs);

    if (!spread || !showOutputs) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center bg-transparent">
                <p className="text-xs text-text-soft tracking-wide">No outputs yet.</p>
            </div>
        );
    }

    const exportItems: ExportItem[] = spread.sections.map((section) => ({
        id: section.id,
        title: section.title,
        type: section.type,
        content: section.content,
    }));

    const currentOutput: ExportItem = {
        id: `output-${activeTab}`,
        title: `Output · ${activeTab}`,
        type: activeTab,
        content:
            activeTab === 'code'
                ? `export default function App() {\n  return (\n    <div className="p-8">\n      <h1 className="text-xl font-semibold">Hello Codra</h1>\n      <p>This is your AI-generated output.</p>\n    </div>\n  );\n}`
                : spread.sections,
    };

    void suggestedDeskId;

    return (
        <div className="flex flex-col h-full bg-white border-l border-[var(--ui-border)]">
            {/* Header */}
            <header className="px-[var(--space-md)] pt-[var(--space-md)] pb-[var(--space-sm)] border-b border-[var(--ui-border)]/60 space-y-[var(--space-md)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-semibold text-text-soft uppercase tracking-wider">Proof</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExportModalOpen(true)}
                            title="Export Artifact"
                            aria-label="Export Artifact"
                        >
                            <Download size={14} />
                        </IconButton>
                        <IconButton 
                            variant="ghost" 
                            size="sm"
                            title="Open External"
                            aria-label="Open External"
                        >
                            <ExternalLink size={14} />
                        </IconButton>
                    </div>
                </div>

                {/* Approval Controls */}
                {showApproval && activeTask && latestVersion && (
                    <div className="pt-2">
                        <ApprovalButtons 
                            version={latestVersion}
                            onStatusChange={(status) => {
                                refreshVersions();
                                if (status === 'approved') {
                                    setIsSuggestionsModalOpen(true);
                                }
                            }}
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 border-b border-transparent">
                    {(['preview', 'code', 'assets'] as Tab[]).map((tab) => (
                        <Button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-2 text-xs font-semibold transition-all relative",
                                activeTab === tab
                                    ? "text-text-primary"
                                    : "text-text-soft hover:text-text-primary"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ui-border)] rounded-full" />
                            )}
                        </Button>
                    ))}
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-[var(--color-border-soft)]/40">
                {activeTab === 'preview' && (
                    <div className="p-4 space-y-8 max-w-full overflow-x-hidden">
                        {spread.sections.map((section) => (
                            <div key={section.id} className="scale-[0.9] origin-top transform-gpu -mb-8">
                                <SpreadSection
                                    section={section}
                                    onUpdate={onSectionUpdate}
                                />
                            </div>
                        ))}
                        {spread.sections.length === 0 && (
                            <EmptyState
                                icon={FileText}
                                title="No artifacts yet"
                                description="Generate your first artifact in any workspace."
                            />
                        )}

                        {/* Interactive Feedback */}
                        {spread.sections.length > 0 && (
                            <div className="pt-8 pb-4 border-t border-zinc-200 dark:border-zinc-800">
                                <ArtifactFeedbackBar
                                    artifactId="session-feedback" // Placeholder until per-section persistence
                                    artifactType="copy"
                                    onSubmit={(feedback) => console.log('Feedback submitted:', feedback)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'code' && (
                    <div className="p-4 font-mono text-xs">
                        <div className="bg-zinc-900 text-zinc-300 p-4 rounded-lg overflow-x-auto shadow-inner">
                            <div className="flex items-center gap-2 mb-4 text-zinc-500 border-b border-zinc-800 pb-2">
                                <Code2 size={12} />
                                <span>main.tsx</span>
                            </div>
                            <pre>
                                {`export default function App() {\n  return (\n    <div className="p-8">\n      <h1 className="text-xl font-semibold">Hello Codra</h1>\n      <p>This is your AI-generated output.</p>\n    </div>\n  );\n}`}
                            </pre>
                        </div>
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="p-4 grid grid-cols-2 gap-2">
                        {/* Mock Assets */}
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden group relative">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                    <IconButton 
                                        variant="secondary" 
                                        size="sm"
                                        aria-label="View asset"
                                    >
                                        <ChevronRight size={14} />
                                    </IconButton>
                                </div>
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon size={24} className="text-zinc-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {taskComplete && null}
            </div>

            {/* Context Stats */}
            <footer className="p-4 border-t border-[var(--ui-border)]/60 bg-white">
                <div className="flex items-center justify-between text-xs text-text-soft font-semibold">
                    <span>Sections</span>
                    <span className="text-text-primary/70">{spread.sections.length}</span>
                </div>
            </footer>

            {/* Suggestions Modal */}
            {activeTask && (
                <SuggestionsModal
                    isOpen={isSuggestionsModalOpen}
                    onClose={() => setIsSuggestionsModalOpen(false)}
                    sourceDesk={activeTask.deskId}
                    artifactType={activeTask.title} // Or artifact.type if available
                    artifactContent={latestVersion?.content || ''}
                    onBatchCreate={async (suggestions) => {
                        if (onBatchCreateTasks) {
                            await onBatchCreateTasks(suggestions);
                        }
                    }}
                />
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                defaultScope="output"
                currentOutput={currentOutput}
                items={exportItems}
                projectName={spread.projectId}
            />
        </div>
    );
}
