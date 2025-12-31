/**
 * CODE CANVAS
 * Adapted from EngineeringDeskCanvas
 * Code, architecture, and technical implementation
 */

import React, { useState } from 'react';
import { Terminal, FileCode, Folder, ChevronRight, Play, CheckCircle2, AlertCircle, ShieldAlert, Activity, Sparkles } from 'lucide-react';
import { MOCK_ERRORS } from '../../../domain/integrations';
import { ModelSelector } from '../ModelSelector';
import { SourceImportOverlay } from './engineering/SourceImportOverlay';

interface CodeCanvasProps {
    projectId: string;
    selectedModelId?: string;
    onSelectModel?: (modelId: string, providerId: string) => void;
}

export const CodeCanvas: React.FC<CodeCanvasProps> = ({ 
    projectId,
    selectedModelId = 'deepseek-coder', 
    onSelectModel 
}) => {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isImported, setIsImported] = useState(false);
    const [files, setFiles] = useState<{ name: string; status: string }[]>([]);

    const [logs, setLogs] = useState<string[]>([
        '# Lyra Terminal v1.0.4',
        '$ codra deploy --preview',
        'Building specialized artifacts...',
        'Injecting memories: Rose-500 accent established.'
    ]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyzeError = (error: any) => {
        setIsAnalyzing(true);
        setLogs(prev => [...prev, `> Analyzing: ${error.message}`, 'Scanning stack trace...', 'Checking dependency graph...', 'Potential fix identified: Update peerDependencies in package.json']);
        setTimeout(() => setIsAnalyzing(false), 2000);
    };

    const handleImport = (source: string) => {
        setIsAnalyzing(true);
        setLogs(prev => [...prev, `$ codra import --source=${source}`, 'Indexing files...', 'Establishing architectural context...']);

        // Simulate a real import
        setTimeout(() => {
            setFiles([
                { name: 'package.json', status: 'ready' },
                { name: 'next.config.js', status: 'ready' },
                { name: 'src/App.tsx', status: 'ready' },
                { name: 'src/main.ts', status: 'ready' },
                { name: 'tsconfig.json', status: 'warning' },
            ]);
            setSelectedFile('src/App.tsx');
            setIsImported(true);
            setIsAnalyzing(false);
            setLogs(prev => [...prev, '✓ Codebase indexed successfully.']);
        }, 1500);
    };

    return (
        <div className="w-full h-full flex gap-6 relative">
            {!isImported && (
                <SourceImportOverlay
                    onImportGithub={(url) => handleImport(url)}
                    onImportLocal={() => handleImport('local')}
                />
            )}

            {/* File Explorer (Surgical) */}
            <aside className="w-56 flex flex-col gap-6">
                <section>
                    <h3 className="text-[10px] text-[var(--desk-text-muted)] font-bold uppercase tracking-widest mb-4">Filesystem</h3>
                    <div className="space-y-1">
                        {files.map(file => (
                            <button
                                key={file.name}
                                onClick={() => setSelectedFile(file.name)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs font-mono ${selectedFile === file.name
                                    ? "bg-[var(--desk-surface)] border border-[var(--desk-border)] text-rose-400 shadow-sm"
                                    : "text-[var(--desk-text-muted)] hover:bg-[var(--desk-bg)]/50"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileCode size={14} className={selectedFile === file.name ? "text-rose-500" : "text-[var(--desk-text-muted)]/60"} />
                                    <span>{file.name}</span>
                                </div>
                                {file.status === 'ready' ? (
                                    <CheckCircle2 size={10} className="text-green-500/50" />
                                ) : (
                                    <AlertCircle size={10} className="text-amber-500/50" />
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] text-[var(--desk-text-muted)] font-bold uppercase tracking-widest">Observability</h3>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-rose-500 uppercase tracking-wider">
                            <Activity size={8} className="animate-pulse" />
                            Sentry Live
                        </span>
                    </div>
                    <div className="space-y-2">
                        {MOCK_ERRORS.map(error => (
                            <div key={error.id} className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 group cursor-help transition-all hover:bg-rose-500/10 text-left">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={10} className="text-rose-500" />
                                        <span className="text-[9px] font-mono text-rose-400 uppercase">{error.culprit}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAnalyzeError(error)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 rounded transition-all"
                                    >
                                        <Sparkles size={8} className="text-rose-400" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-[var(--desk-text-muted)] line-clamp-1 group-hover:line-clamp-none transition-all">{error.message}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] text-[var(--desk-text-muted)] font-bold uppercase tracking-widest mb-4">Operations</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[var(--desk-text-muted)]/80 uppercase tracking-widest block ml-1">AI Architect</label>
                            <ModelSelector
                                selectedModelId={selectedModelId}
                                onSelectModel={onSelectModel || (() => { })}
                                filterTag="code"
                                variant="default"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--desk-bg)] hover:bg-[var(--desk-surface)] border border-[var(--desk-border)] rounded-lg text-[10px] font-bold uppercase tracking-wider text-[var(--desk-text-muted)] transition-colors">
                                <Play size={10} className="text-green-500" />
                                Run Dev Server
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--desk-bg)] hover:bg-[var(--desk-surface)] border border-[var(--desk-border)] rounded-lg text-[10px] font-bold uppercase tracking-wider text-[var(--desk-text-muted)] transition-colors">
                                <Terminal size={10} className="text-rose-500" />
                                Open Logs
                            </button>
                        </div>
                    </div>
                </section>
            </aside>

            {/* Code Stage */}
            <div className="flex-1 flex flex-col bg-[var(--desk-bg)]/50 border border-[var(--desk-border)] rounded-3xl overflow-hidden shadow-2xl">
                <header className="p-4 border-b border-[var(--desk-border)] bg-[var(--desk-surface)]/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Folder size={14} className="text-[var(--desk-text-muted)]" />
                        <ChevronRight size={10} className="text-[var(--desk-border)]" />
                        <span className="text-xs font-mono text-[var(--desk-text-muted)]">src / engine / <span className="text-[var(--desk-text-primary)]">{selectedFile}</span></span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--desk-bg)]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--desk-bg)]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--desk-bg)]" />
                    </div>
                </header>

                <div className="flex-1 p-6 font-mono text-xs text-[var(--desk-text-primary)]/80 leading-relaxed overflow-y-auto">
                    {selectedFile ? (
                        <pre>
                            {`/**\n * ${selectedFile}\n * Generated by Lyra Code Desk\n */\n\nimport { useEffect } from 'react';\n\nexport function Component() {\n  // Implementation details follow the Bauhaus editorial pattern\n  // Using high-contrast mono spacing\n  \n  return (\n    <div className="p-12">\n      <h1 className="text-2xl font-black uppercase tracking-tighter">\n        Production Architecture\n      </h1>\n    </div>\n  );\n}`}
                        </pre>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                            <FileCode size={48} className="mb-4" />
                            <p className="font-bold">Select a file to view source</p>
                        </div>
                    )}
                </div>

                {/* Terminal simulation */}
                <footer className="h-40 bg-[var(--desk-bg)] border-t border-[var(--desk-border)] p-4 font-mono text-[10px] text-[var(--desk-text-muted)] flex flex-col gap-1 overflow-y-auto shadow-inner relative">
                    <div className="absolute top-2 right-4 flex items-center gap-2">
                        {isAnalyzing && (
                            <span className="flex items-center gap-1 text-rose-500 animate-pulse uppercase font-bold tracking-tighter">
                                <Sparkles size={10} />
                                Analysis in progress
                            </span>
                        )}
                        <span className="text-[var(--desk-border)]">UTF-8</span>
                    </div>
                    {logs.map((log, i) => (
                        <p key={i} className={log.startsWith('$') ? 'text-green-500/80' : log.startsWith('>') ? 'text-rose-400' : ''}>{log}</p>
                    ))}
                    <p className="text-rose-500 animate-pulse mt-1">_</p>
                </footer>
            </div>
        </div>
    );
};
