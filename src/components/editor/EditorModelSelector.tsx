/**
 * Editor Model Selector
 * Dynamic model dropdown for the AI code editor
 * Fetches models from AIMLAPI and filters for code-optimized ones
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { categorizeModel, filterModelsByTask } from '../../lib/ai/model-categorizer';
import { TaskCategory, CostTier, LatencyTier, EnhancedModelInfo } from '../../lib/ai/types-agent-selector';

interface EditorModelSelectorProps {
    selectedModelId: string;
    onModelChange: (modelId: string, modelInfo?: EnhancedModelInfo) => void;
    compact?: boolean;
}

// Curated list of recommended coding models
const CODING_MODEL_PRIORITY = [
    'deepseek-coder',
    'gpt-4o',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet',
    'gpt-4-turbo',
    'codellama-70b-instruct',
    'gpt-3.5-turbo',
    'mistral-large',
];

export const EditorModelSelector: React.FC<EditorModelSelectorProps> = ({
    selectedModelId,
    onModelChange,
    compact = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [models, setModels] = useState<EnhancedModelInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initialize with static models
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        try {
            const allModels = [
                // Code-optimized models
                { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', contextWindow: 4096, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0002, capabilities: ['code'] },
                { id: 'gpt-4o', name: 'GPT-4o', provider: 'aimlapi', contextWindow: 128000, costPer1kPrompt: 0.005, costPer1kCompletion: 0.015, capabilities: ['chat', 'code'] },
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'aimlapi', contextWindow: 200000, costPer1kPrompt: 0.003, costPer1kCompletion: 0.015, capabilities: ['chat', 'code'] },
                { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', provider: 'aimlapi', contextWindow: 8000, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0003, capabilities: ['chat', 'code'] },
                { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B', provider: 'aimlapi', contextWindow: 32768, costPer1kPrompt: 0.000014, costPer1kCompletion: 0.000042, capabilities: ['chat', 'code'] },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'aimlapi', contextWindow: 128000, costPer1kPrompt: 0.00015, costPer1kCompletion: 0.0006, capabilities: ['chat', 'code'] },
                { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', contextWindow: 64000, costPer1kPrompt: 0.0001, costPer1kCompletion: 0.0002, capabilities: ['chat', 'code'] },
            ];

            // Categorize each model
            const categorized = allModels.map(m => categorizeModel(m)) as EnhancedModelInfo[];

            // Filter for CODE_ASSISTANCE models
            const codeModels = filterModelsByTask(categorized, TaskCategory.CODE_ASSISTANCE);

            // Sort by priority (curated list first, then alphabetical)
            const sorted = codeModels.sort((a, b) => {
                const aIndex = CODING_MODEL_PRIORITY.findIndex(id => a.id.includes(id));
                const bIndex = CODING_MODEL_PRIORITY.findIndex(id => b.id.includes(id));

                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.name.localeCompare(b.name);
            });

            setModels(sorted);
        } catch (e) {
            console.error('Failed to initialize models:', e);
            setError('Failed to load models');
            // Fallback to static list
            setModels([
                { id: 'gpt-4o', name: 'GPT-4o', provider: 'aimlapi', costTier: CostTier.MEDIUM, latencyTier: LatencyTier.MEDIUM } as EnhancedModelInfo,
                { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', costTier: CostTier.LOW, latencyTier: LatencyTier.FAST } as EnhancedModelInfo,
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'aimlapi', costTier: CostTier.LOW, latencyTier: LatencyTier.FAST } as EnhancedModelInfo,
            ]);
        }
        setIsLoading(false);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

    const getCostIcon = (tier: CostTier) => {
        switch (tier) {
            case CostTier.FREE: return '🆓';
            case CostTier.LOW: return '$';
            case CostTier.MEDIUM: return '$$';
            case CostTier.HIGH: return '$$$';
            case CostTier.PREMIUM: return '$$$$';
            default: return '$';
        }
    };

    const getSpeedIcon = (tier: LatencyTier) => {
        switch (tier) {
            case LatencyTier.FAST: return '⚡';
            case LatencyTier.MEDIUM: return '🔵';
            case LatencyTier.SLOW: return '🐢';
            default: return '🔵';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#6b7280]">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading models...</span>
            </div>
        );
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#1a1d21] border border-[rgba(243,244,230,0.09)] rounded-lg text-sm text-[#f3f4e6] hover:bg-[rgba(243,244,230,0.05)] transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    {selectedModel && (
                        <>
                            <span className="text-xs opacity-60">{getSpeedIcon(selectedModel.latencyTier)}</span>
                            <span className="truncate">{compact ? selectedModel.id : selectedModel.name}</span>
                            {!compact && (
                                <span className="text-xs text-[#6b7280]">({selectedModel.provider})</span>
                            )}
                        </>
                    )}
                    {!selectedModel && <span className="text-[#6b7280]">Select model...</span>}
                </div>
                <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-[#0f1214] border border-[rgba(243,244,230,0.09)] rounded-lg shadow-xl z-50">
                    {error && (
                        <div className="px-3 py-2 text-xs text-amber-400 border-b border-[rgba(243,244,230,0.09)]">
                            ⚠️ {error} - showing defaults
                        </div>
                    )}

                    {/* Recommended section */}
                    <div className="px-3 py-1.5 text-xs text-[#4e808d] font-medium border-b border-[rgba(243,244,230,0.09)]">
                        Recommended for Coding
                    </div>

                    {models.slice(0, 5).map(model => (
                        <button
                            key={model.id}
                            onClick={() => {
                                onModelChange(model.id, model);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-[rgba(243,244,230,0.05)] transition-colors ${selectedModelId === model.id ? 'bg-[#4e808d]/20' : ''
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">{getSpeedIcon(model.latencyTier)}</span>
                                    <span className="text-sm text-[#f3f4e6]">{model.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                                    <span>{getCostIcon(model.costTier)}</span>
                                    <span>{model.provider}</span>
                                </div>
                            </div>
                            {model.bestForTasks && model.bestForTasks.length > 0 && (
                                <div className="mt-1 text-xs text-[#6b7280] truncate">
                                    {model.bestForTasks.slice(0, 2).join(', ')}
                                </div>
                            )}
                        </button>
                    ))}

                    {models.length > 5 && (
                        <>
                            <div className="px-3 py-1.5 text-xs text-[#6b7280] font-medium border-t border-b border-[rgba(243,244,230,0.09)]">
                                All Code-Capable Models ({models.length - 5} more)
                            </div>

                            {models.slice(5).map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model.id, model);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left hover:bg-[rgba(243,244,230,0.05)] transition-colors ${selectedModelId === model.id ? 'bg-[#4e808d]/20' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">{getSpeedIcon(model.latencyTier)}</span>
                                            <span className="text-sm text-[#f3f4e6]">{model.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-[#6b7280]">
                                            <span>{getCostIcon(model.costTier)}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
