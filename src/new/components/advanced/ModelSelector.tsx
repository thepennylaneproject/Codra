import { useState, useMemo, useRef, useEffect } from 'react';
import { useProviderRegistry } from '../../../lib/ai/registry/useProviderRegistry';
import { ModelRegistryEntry, ProviderRegistryEntry } from '../../../lib/ai/registry/types';
import { TaskCostBadge } from '../TaskCostBadge';
import { Search, ChevronDown, Check, Zap, Brain, Sparkles, Cpu, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ModelSelectorProps {
    selectedModelId: string;
    onSelectModel: (modelId: string, providerId: string) => void;
    className?: string;
    filterTag?: string;
    variant?: 'default' | 'minimal';
    label?: string;
    isSmartMode?: boolean;
}

type ModelOption = ModelRegistryEntry & {
    providerId: string;
    providerName: string;
};

export function ModelSelector({
    selectedModelId,
    onSelectModel,
    className,
    filterTag,
    variant = 'default',
    label,
    isSmartMode
}: ModelSelectorProps) {
    const { providers, isLoading, error } = useProviderRegistry() as {
        providers: ProviderRegistryEntry[];
        isLoading: boolean;
        error: unknown;
    };
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, anchor: 'top' as 'top' | 'bottom' });

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Determine if we should open bottom or top
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpwards = spaceBelow < 400; // Dropdown is max 400px

            setCoords({
                top: openUpwards ? rect.top - 8 : rect.bottom + 8,
                left: rect.left,
                width: Math.max(rect.width, 320),
                anchor: openUpwards ? 'bottom' : 'top'
            });
        }
    }, [isOpen]);

    const allModels = useMemo<ModelOption[]>(() => {
        const models = providers.flatMap((p: ProviderRegistryEntry) =>
            p.models.map((m: ModelRegistryEntry) => ({
                ...m,
                providerId: p.id,
                providerName: p.displayName
            }))
        );

        if (filterTag) {
            return models.filter(m => m.tags?.includes(filterTag));
        }
        return models;
    }, [providers, filterTag]);

    const filteredModels = useMemo(() => {
        if (!searchQuery) return allModels;
        const query = searchQuery.toLowerCase();
        return allModels.filter(m =>
            m.displayName.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query) ||
            m.creator.toLowerCase().includes(query) ||
            m.providerName.toLowerCase().includes(query)
        );
    }, [allModels, searchQuery]);

    const groupedModels = useMemo(() => {
        const groups: Record<string, typeof allModels> = {};
        filteredModels.forEach(m => {
            const groupKey = m.creator;
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(m);
        });
        return groups;
    }, [filteredModels]);

    const selectedModel = useMemo(() =>
        allModels.find(m => m.id === selectedModelId) || allModels[0],
        [allModels, selectedModelId]);

    if (error) return <div className="text-xs text-rose-500 p-2">Failed to load models.</div>;

    const getModelIcon = (tags: string[] = []) => {
        if (tags.includes('reasoning')) return <Brain size={12} className="text-purple-500" />;
        if (tags.includes('fast')) return <Zap size={12} className="text-amber-500" />;
        if (tags.includes('multimodal')) return <Sparkles size={12} className="text-rose-500" />;
        if (tags.includes('visual')) return <div className="w-3 h-3 rounded-sm bg-zinc-400" />;
        return <Cpu size={12} className="text-zinc-400" />;
    };

    return (
        <div className={cn("relative z-20", className)}>
            {/* Trigger */}
            <Button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 transition-all duration-500 group/trigger",
                    variant === 'default'
                        ? "w-full justify-between px-3 py-2 rounded-xl border bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 shadow-sm"
                        : "py-1 px-2 rounded hover:bg-[#1A1A1A]/5",
                    isOpen && variant === 'default' && "ring-1 ring-zinc-400/30 border-zinc-400/50 shadow-xl"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {isLoading ? (
                        <div className="w-3 h-3 rounded-full border-t border-rose-500 animate-spin" />
                    ) : (
                        getModelIcon(selectedModel?.tags)
                    )}
                    <div className="flex flex-col items-start overflow-hidden">
                        {(label || (variant === 'default' && selectedModel?.creator)) && (
                            <span className="text-xs font-semibold text-zinc-400 leading-none mb-0">
                                {label || selectedModel?.creator}
                            </span>
                        )}
                        <div className="flex items-center gap-1 overflow-hidden">
                            <span className={cn(
                                "font-semibold truncate",
                                variant === 'default'
                                    ? "text-xs text-text-primary"
                                    : "text-xs text-zinc-500 group-hover/trigger:text-zinc-500 transition-colors"
                            )}>
                                {selectedModel?.displayName || 'Select Model...'}
                            </span>
                            {isSmartMode && variant === 'default' && (
                                <div className="flex items-center gap-1 bg-zinc-200/50 text-zinc-500 px-2 py-0 rounded-full scale-90">
                                    <Sparkles size={8} fill="currentColor" />
                                    <span className="text-xs font-semibold">Smart</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {/* Dropdown Popover - Using fixed to avoid clipping by parent masks/overflows */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: coords.anchor === 'bottom' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-[9999] bg-white border border-[#1A1A1A]/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[400px]"
                        style={{
                            top: coords.anchor === 'bottom' ? 'auto' : coords.top,
                            bottom: coords.anchor === 'bottom' ? window.innerHeight - (coords.top + 8) : 'auto',
                            left: coords.left,
                            width: coords.width,
                        }}
                    >
                        {/* Search Bar */}
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 transition-colors" size={14} />
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search creators or models..."
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs outline-none focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                            {Object.entries(groupedModels).length === 0 ? (
                                <div className="p-4 text-center text-xs text-zinc-500">
                                    No models found matching &quot;{searchQuery}&quot;
                                </div>
                            ) : (
                                Object.entries(groupedModels)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([creatorName, models]) => (
                                        <div key={creatorName} className="mb-2 last:mb-0">
                                            <label className="px-3 py-1 text-xs font-semibold text-zinc-500 block border-b border-zinc-50 dark:border-zinc-800/50 mb-1">
                                                {creatorName}
                                            </label>
                                            <div className="space-y-0">
                                                {models.map(model => (
                                                    <Button
                                                        key={`${model.providerId}-${model.id}`}
                                                        onClick={() => {
                                                            onSelectModel(model.id, model.providerId);
                                                            setIsOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all group",
                                                            selectedModelId === model.id
                                                                ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-medium"
                                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 flex justify-center">
                                                                {selectedModelId === model.id ? (
                                                                    <Check size={14} />
                                                                ) : (
                                                                    getModelIcon(model.tags)
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs">{model.displayName}</span>
                                                                <span className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
                                                                    {model.modalities.join(', ')} • {model.contextWindow.toLocaleString()} tokens
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {model.priceHint && (
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <TaskCostBadge
                                                                    cost={(model.priceHint.inputPer1k + model.priceHint.outputPer1k) / 2}
                                                                    variant="preview"
                                                                    label=""
                                                                />
                                                            </div>
                                                        )}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2 text-xs text-zinc-400">
                            <Info size={12} />
                            <span>Changes apply to next execution</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop for closing */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
