import React from 'react';
import { Kanban, Clock, ExternalLink, Filter, Plus, Zap } from 'lucide-react';
import { MOCK_ISSUES } from '../../../domain/integrations';
import { ModelSelector } from '../ModelSelector';

interface WorkflowDeskCanvasProps {
    selectedModelId?: string;
    onSelectModel?: (modelId: string, providerId: string) => void;
}

export const WorkflowDeskCanvas: React.FC<WorkflowDeskCanvasProps> = ({ selectedModelId = 'gpt-4o-mini', onSelectModel }) => {
    return (
        <div className="w-full h-full flex flex-col gap-8">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase text-[var(--desk-text-primary)]">Workflow Studio</h2>
                    <p className="text-xs text-[var(--desk-text-muted)] font-mono uppercase tracking-widest mt-1">Linear Integration Active</p>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--desk-bg)]/50 border border-[var(--desk-border)] rounded-xl">
                        <Zap size={12} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-[var(--desk-text-muted)] uppercase tracking-widest">Orchestrator</span>
                        <ModelSelector
                            selectedModelId={selectedModelId}
                            onSelectModel={onSelectModel || (() => { })}
                            filterTag="balanced"
                            variant="minimal"
                            className="w-auto"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--desk-bg)] border border-[var(--desk-border)] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] transition-all">
                        <Filter size={12} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--desk-text-primary)] text-[var(--desk-surface)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--desk-text-primary)]/90 transition-all shadow-xl">
                        <Plus size={12} />
                        New Assignment
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
                {['Backlog', 'In Progress', 'Done'].map(column => (
                    <div key={column} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-bold text-[var(--desk-text-muted)] uppercase tracking-[0.2em]">{column}</h3>
                            <span className="text-[10px] font-mono text-[var(--desk-text-muted)]/50">
                                {column === 'In Progress' ? MOCK_ISSUES.filter(i => i.status === 'In Progress').length : 0}
                            </span>
                        </div>

                        <div className="flex-1 rounded-2xl border-2 border-dashed border-[var(--desk-border)] bg-[var(--desk-bg)]/5 p-4 space-y-4 overflow-y-auto">
                            {column === 'In Progress' && MOCK_ISSUES.filter(i => i.status === 'In Progress').map(issue => (
                                <div key={issue.id} className="p-4 rounded-xl bg-[var(--desk-surface)] border border-[var(--desk-border)] shadow-xl group hover:border-rose-500/50 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                                            <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">{issue.priority}</span>
                                        </div>
                                        <button className="text-[var(--desk-text-muted)] hover:text-[var(--desk-text-primary)] transition-colors">
                                            <ExternalLink size={12} />
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-bold text-[var(--desk-text-primary)] leading-tight mb-4 group-hover:text-rose-500 transition-colors">
                                        {issue.title}
                                    </h4>
                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--desk-border)]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-[var(--desk-bg)] border border-[var(--desk-border)] flex items-center justify-center text-[8px] font-bold text-[var(--desk-text-muted)]">
                                                LC
                                            </div>
                                            <span className="text-[10px] text-[var(--desk-text-muted)] font-mono">Lyra Assistant</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-[var(--desk-text-muted)]/60">
                                            <Clock size={10} />
                                            <span>2d</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {column === 'Backlog' && MOCK_ISSUES.filter(i => i.status === 'Backlog').map(issue => (
                                <div key={issue.id} className="p-4 rounded-xl bg-[var(--desk-bg)]/50 border border-[var(--desk-border)] opacity-60 hover:opacity-100 transition-all">
                                    <h4 className="text-sm font-bold text-[var(--desk-text-muted)] mb-2">{issue.title}</h4>
                                    <span className="text-[8px] font-mono text-[var(--desk-text-muted)]/50 uppercase tracking-widest">{issue.source}</span>
                                </div>
                            ))}

                            {MOCK_ISSUES.filter(i => column === 'In Progress' ? i.status === 'In Progress' : (column === 'Backlog' ? i.status === 'Backlog' : false)).length === 0 && (
                                <div className="h-full flex items-center justify-center text-center p-8 opacity-20 grayscale">
                                    <Kanban size={32} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
