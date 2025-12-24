/**
 * COMPONENTS SECTION
 * Asset management and component tracking with usage metrics
 */

import { Box, CheckCircle2, Clock, Play, BarChart2, MoreHorizontal } from 'lucide-react';

interface Component {
    name: string;
    type: string;
    status: 'pending' | 'draft' | 'ready' | 'final';
    usageCount?: number;
    lastUpdated?: string;
}

interface ComponentsSectionProps {
    content: any;
    isEditing?: boolean;
    onUpdate?: (content: any) => void;
}

const STATUS_CONFIG = {
    pending: { color: 'text-zinc-400', bg: 'bg-zinc-100', icon: Clock },
    draft: { color: 'text-amber-500', bg: 'bg-amber-50', icon: Play },
    ready: { color: 'text-indigo-500', bg: 'bg-indigo-50', icon: Box },
    final: { color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 },
};

export function ComponentsSection({ content, isEditing, onUpdate }: ComponentsSectionProps) {
    const components = (content.components as Component[]) || [];

    const handleUpdateStatus = (index: number, status: Component['status']) => {
        if (!onUpdate) return;
        const newComponents = [...components];
        newComponents[index].status = status;
        onUpdate({ ...content, components: newComponents });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <span className="block text-[10px] uppercase tracking-wide text-zinc-400 font-bold">
                    Asset Management
                </span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <BarChart2 size={12} className="text-zinc-400" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{components.length} Assets</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {components.map((comp, i) => {
                    const config = STATUS_CONFIG[comp.status] || STATUS_CONFIG.pending;
                    return (
                        <div
                            key={i}
                            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                                    <config.icon size={20} />
                                </div>
                                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            <div className="space-y-1 mb-4">
                                <h4 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {comp.name}
                                </h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                    {comp.type}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-tighter">
                                        Usage: <span className="text-zinc-900 dark:text-zinc-200 font-mono">{comp.usageCount || 0}</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-400 font-medium uppercase tracking-tighter">
                                        Status: <span className={config.color}>{comp.status}</span>
                                    </div>
                                </div>

                                {isEditing && (
                                    <select
                                        value={comp.status}
                                        onChange={(e) => handleUpdateStatus(i, e.target.value as Component['status'])}
                                        className="text-[9px] font-bold uppercase bg-transparent text-zinc-500 focus:outline-none cursor-pointer"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="draft">Draft</option>
                                        <option value="ready">Ready</option>
                                        <option value="final">Final</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isEditing && (
                    <button className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:border-indigo-200 hover:text-indigo-400 transition-all group">
                        <Box size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">+ Define Asset</span>
                    </button>
                )}
            </div>
        </div>
    );
}
