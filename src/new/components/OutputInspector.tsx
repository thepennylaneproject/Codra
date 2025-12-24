import { useState } from 'react';
import { Spread } from '../../domain/types';
import { Code2, Image as ImageIcon, FileText, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { SpreadSection } from './SpreadSection';
import { ArtifactFeedbackBar } from './ArtifactFeedbackBar';
import { ExportModal } from './ExportModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface OutputInspectorProps {
    spread: Spread | null;
    onSectionUpdate?: (sectionId: string, content: Record<string, unknown>) => void;
}

type Tab = 'preview' | 'code' | 'assets';

export function OutputInspector({ spread, onSectionUpdate }: OutputInspectorProps) {
    const [activeTab, setActiveTab] = useState<Tab>('preview');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    if (!spread) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center bg-white dark:bg-zinc-950">
                <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">
                    Waiting for output...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <header className="px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-900 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                        Output Inspector
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="text-zinc-400 hover:text-indigo-500 transition-colors"
                            title="Export Artifact"
                        >
                            <Download size={14} />
                        </button>
                        <button className="text-zinc-400 hover:text-rose-500 transition-colors">
                            <ExternalLink size={14} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-transparent">
                    {(['preview', 'code', 'assets'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "pb-2 text-[10px] font-bold uppercase tracking-wider transition-all relative",
                                activeTab === tab
                                    ? "text-rose-500"
                                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-900/10">
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
                            <div className="py-20 text-center">
                                <FileText size={32} className="mx-auto text-zinc-200 mb-4" />
                                <p className="text-xs text-zinc-400">No preview sections yet.</p>
                            </div>
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
                                {`export default function App() {\n  return (\n    <div className="p-8">\n      <h1 className="text-3xl font-bold">Hello Codra</h1>\n      <p>This is your AI-generated output.</p>\n    </div>\n  );\n}`}
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
                                    <button className="p-2 bg-white rounded-full shadow-lg">
                                        <ChevronRight size={14} className="text-rose-500" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon size={24} className="text-zinc-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Context Stats */}
            <footer className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    <span>Artifacts Generated</span>
                    <span className="text-zinc-600 dark:text-zinc-300">{spread.sections.length}</span>
                </div>
            </footer>

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                artifactId={spread.id}
                artifactType="spread"
                content={JSON.stringify(spread, null, 2)}
                filename={`codra-spread-${spread.id.slice(0, 8)}`}
            />
        </div>
    );
}
