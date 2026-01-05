import { Github, FolderOpen, Code2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface SourceImportOverlayProps {
    onImportGithub: (url: string) => void;
    onImportLocal: () => void;
}

export function SourceImportOverlay({ onImportGithub, onImportLocal }: SourceImportOverlayProps) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-8 glass-panel-light border-0 rounded-none bg-[var(--desk-bg)]/80">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-[var(--desk-surface)] border border-[var(--desk-border)] rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
                    <Code2 size={32} />
                </div>

                <h2 className="text-xl font-semibold tracking-tight text-desk-text-primary mb-2">
                    Import Codebase
                </h2>
                <p className="text-sm text-desk-text-muted mb-8 leading-relaxed font-medium">
                    Bring your development project into the Codra workspace for architectural analysis and production coordination.
                </p>

                <div className="w-full flex flex-col gap-4">
                    <Button
                        onClick={() => {
                            const url = prompt("Enter GitHub Repository URL:");
                            if (url) onImportGithub(url);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-[var(--desk-bg)] hover:bg-rose-500/5 border border-[var(--desk-border)] hover:border-rose-500/30 rounded-2xl transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-900 text-white rounded-xl">
                                <Github size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold text-desk-text-primary">Connect GitHub</p>
                                <p className="text-xs text-desk-text-muted">Import from remote repository</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-zinc-300 group-hover:text-rose-500 transition-colors" />
                    </Button>

                    <Button
                        onClick={onImportLocal}
                        className="w-full flex items-center justify-between p-4 bg-[var(--desk-bg)] hover:bg-rose-500/5 border border-[var(--desk-border)] hover:border-rose-500/30 rounded-2xl transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl">
                                <FolderOpen size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold text-desk-text-primary">Open Local Project</p>
                                <p className="text-xs text-desk-text-muted">Drop codebase folder or directory</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-zinc-300 group-hover:text-rose-500 transition-colors" />
                    </Button>
                </div>

                <div className="mt-8 pt-8 border-t border-[var(--desk-border)] w-full">
                    <p className="text-xs font-mono text-desk-text-muted">
                        Codra indexing • Analysis v2.5
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
