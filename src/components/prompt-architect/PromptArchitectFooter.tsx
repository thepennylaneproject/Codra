/**
 * PROMPT ARCHITECT - Panel Footer
 * src/components/prompt-architect/PromptArchitectFooter.tsx
 * 
 * Token/cost estimates, model selector, status indicator, and grounding controls
 */

import React, { useState, useMemo } from 'react';
import { Coins, Timer, Cpu, AlertCircle, CheckCircle2, HelpCircle, ChevronDown, ChevronRight, Loader2, Globe, Search, Sparkles, Info } from 'lucide-react';
import { usePromptArchitectStore } from '../../lib/prompt-architect';
import { ArchitectStatus, GroundingProvider } from '../../lib/prompt-architect/types';
import { cn } from '../../lib/utils';
import {
    smartRouter,
    mapOutputTypeToTaskType,
    mapModeToQuality,
    type SmartRouterResult,
} from '../../lib/ai/router/index';

// ============================================================
// Status Configuration
// ============================================================

interface StatusConfig {
    label: string;
    icon: React.ReactNode;
    color: string;
}

const STATUS_CONFIGS: Record<ArchitectStatus, StatusConfig> = {
    idle: {
        label: 'Ready',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: 'text-stardust-dim',
    },
    analyzing: {
        label: 'Analyzing...',
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        color: 'text-energy-cyan',
    },
    'needs-clarification': {
        label: 'Needs clarification',
        icon: <HelpCircle className="w-3.5 h-3.5" />,
        color: 'text-energy-gold',
    },
    generating: {
        label: 'Generating...',
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        color: 'text-energy-teal',
    },
    ready: {
        label: 'Ready to run',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        color: 'text-state-success',
    },
    error: {
        label: 'Error',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        color: 'text-state-error',
    },
};

// ============================================================
// Available Models (simplified list)
// ============================================================

/** Model option type with auto supported */
interface ModelOption {
    id: string;
    label: string;
    description: string;
    isAuto?: boolean;
}

const AVAILABLE_MODELS: ModelOption[] = [
    { id: 'auto', label: 'Auto', description: 'Smart selection', isAuto: true },
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Most capable' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cheap' },
    { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', description: 'Balanced' },
    { id: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku', description: 'Very fast' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Large context' },
    { id: 'dall-e-3', label: 'DALL-E 3', description: 'Image generation' },
];

// ============================================================
// Available Grounding Providers
// ============================================================

const GROUNDING_PROVIDERS: { id: GroundingProvider; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'brave', label: 'Brave' },
    { id: 'tavily', label: 'Tavily' },
];

// ============================================================
// Component
// ============================================================

export const PromptArchitectFooter: React.FC = () => {
    const generatedPrompt = usePromptArchitectStore(state => state.generatedPrompt);
    const status = usePromptArchitectStore(state => state.status);
    const errorMessage = usePromptArchitectStore(state => state.errorMessage);
    const selectedModel = usePromptArchitectStore(state => state.selectedModel);
    const setSelectedModel = usePromptArchitectStore(state => state.setSelectedModel);

    // Context and mode for Smart Router
    const context = usePromptArchitectStore(state => state.context);
    const mode = usePromptArchitectStore(state => state.mode);

    // Grounding state
    const groundingConfig = usePromptArchitectStore(state => state.groundingConfig);
    const setGroundingEnabled = usePromptArchitectStore(state => state.setGroundingEnabled);
    const setGroundingProvider = usePromptArchitectStore(state => state.setGroundingProvider);
    const setGroundingMaxResults = usePromptArchitectStore(state => state.setGroundingMaxResults);
    const isFetchingSources = usePromptArchitectStore(state => state.isFetchingSources);

    // Calculate auto router result when mode is auto
    const autoRouterResult = useMemo((): SmartRouterResult | null => {
        if (selectedModel !== 'auto') return null;

        const taskType = mapOutputTypeToTaskType(context.outputType);
        const quality = mapModeToQuality(mode);

        return smartRouter.route({
            taskType,
            quality,
            minContextWindow: context.metadata?.minContextWindow as number | undefined,
        });
    }, [selectedModel, context.outputType, mode, context.metadata]);

    const statusConfig = STATUS_CONFIGS[status];

    return (
        <div className="border-t border-glass-edge bg-void-elevated/50 px-4 py-3">
            {/* Error Message */}
            {status === 'error' && errorMessage && (
                <div className="mb-2 p-2 bg-state-error/10 border border-state-error/30 rounded-md text-xs text-state-error">
                    {errorMessage}
                </div>
            )}

            {/* Grounding Controls Row */}
            <div className="mb-3 flex items-center gap-3 flex-wrap">
                {/* Ground with sources toggle */}
                <button
                    onClick={() => setGroundingEnabled(!groundingConfig.enabled)}
                    className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                        groundingConfig.enabled
                            ? 'bg-energy-teal/20 text-energy-teal border border-energy-teal/40'
                            : 'bg-void-soft text-stardust-muted border border-glass-edge hover:border-glass-edge-bright'
                    )}
                >
                    {isFetchingSources ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>Ground with sources</span>
                </button>

                {/* Provider dropdown - only show when grounding is enabled */}
                {groundingConfig.enabled && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-stardust-dim uppercase">Provider:</span>
                            <select
                                value={groundingConfig.provider}
                                onChange={(e) => setGroundingProvider(e.target.value as GroundingProvider)}
                                className="bg-void-soft border border-glass-edge rounded px-2 py-1 text-xs text-stardust focus:outline-none focus:border-energy-teal/50"
                            >
                                {GROUNDING_PROVIDERS.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Max results control */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-stardust-dim uppercase">Max:</span>
                            <select
                                value={groundingConfig.maxResults}
                                onChange={(e) => setGroundingMaxResults(parseInt(e.target.value, 10))}
                                className="bg-void-soft border border-glass-edge rounded px-2 py-1 text-xs text-stardust focus:outline-none focus:border-energy-teal/50"
                            >
                                {[3, 4, 5, 6, 7, 8].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* Main Footer Row */}
            <div className="flex items-center justify-between gap-3">
                {/* Left: Token/Cost Estimates */}
                <div className="flex items-center gap-4 text-[11px]">
                    {generatedPrompt ? (
                        <>
                            {/* Token Estimate */}
                            <div className="flex items-center gap-1.5 text-stardust-muted">
                                <Timer className="w-3.5 h-3.5" />
                                <span>~{generatedPrompt.estimatedTokens.toLocaleString()} tokens</span>
                            </div>

                            {/* Cost Estimate */}
                            <div className="flex items-center gap-1.5 text-stardust-muted">
                                <Coins className="w-3.5 h-3.5" />
                                <span>${generatedPrompt.estimatedCost.toFixed(4)}</span>
                            </div>

                            {/* Sources count if grounded */}
                            {generatedPrompt.sources && generatedPrompt.sources.length > 0 && (
                                <div className="flex items-center gap-1.5 text-energy-cyan">
                                    <Search className="w-3.5 h-3.5" />
                                    <span>{generatedPrompt.sources.length} source(s)</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-stardust-dim">Estimates will appear here</span>
                    )}
                </div>

                {/* Right: Model Selector */}
                <ModelSelector
                    value={selectedModel}
                    onChange={setSelectedModel}
                    autoRouterResult={autoRouterResult}
                />
            </div>

            {/* Status Indicator */}
            <div className="mt-2 flex items-center justify-between">
                <div className={cn('flex items-center gap-1.5 text-xs', statusConfig.color)}>
                    {statusConfig.icon}
                    <span>
                        {isFetchingSources ? 'Fetching sources...' : statusConfig.label}
                    </span>
                </div>

                {/* Recommended Model Hint */}
                {generatedPrompt && generatedPrompt.recommendedModel !== selectedModel && (
                    <button
                        onClick={() => setSelectedModel(generatedPrompt.recommendedModel)}
                        className="text-[10px] text-energy-teal hover:underline"
                    >
                        Recommended: {generatedPrompt.recommendedModel}
                    </button>
                )}
            </div>
        </div>
    );
};

// ============================================================
// Model Selector with Auto + "Why this model" section
// ============================================================

interface ModelSelectorProps {
    value: string;
    onChange: (model: string) => void;
    autoRouterResult: SmartRouterResult | null;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange, autoRouterResult }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTraceExpanded, setIsTraceExpanded] = useState(false);

    const currentModel = AVAILABLE_MODELS.find(m => m.id === value) || AVAILABLE_MODELS[1];
    const isAutoMode = value === 'auto';

    // Get the actual selected model for display when in auto mode
    const displayLabel = isAutoMode && autoRouterResult
        ? `Auto → ${smartRouter.getModelDisplayName(autoRouterResult.selected.modelId)}`
        : currentModel.label;

    return (
        <div className="relative">
            {/* Model Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 bg-void-soft border rounded-md transition-colors",
                    isAutoMode
                        ? "border-energy-gold/50 hover:border-energy-gold"
                        : "border-glass-edge hover:border-glass-edge-bright"
                )}
            >
                {isAutoMode ? (
                    <Sparkles className="w-3.5 h-3.5 text-energy-gold" />
                ) : (
                    <Cpu className="w-3.5 h-3.5 text-stardust-muted" />
                )}
                <span className={cn(
                    "text-xs",
                    isAutoMode ? "text-energy-gold" : "text-stardust"
                )}>
                    {displayLabel}
                </span>
                <ChevronDown className="w-3 h-3 text-stardust-muted" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full mb-1 right-0 z-50 py-1 bg-void-elevated border border-glass-edge rounded-lg shadow-cosmic-sm min-w-[200px]">
                        {AVAILABLE_MODELS.map(model => (
                            <button
                                key={model.id}
                                onClick={() => { onChange(model.id); setIsOpen(false); }}
                                className={cn(
                                    'w-full px-3 py-2 text-left transition-colors flex items-center justify-between',
                                    value === model.id
                                        ? 'bg-energy-teal/10'
                                        : 'hover:bg-white/5'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {model.isAuto ? (
                                        <Sparkles className="w-3 h-3 text-energy-gold" />
                                    ) : null}
                                    <span className={cn(
                                        'text-xs',
                                        value === model.id ? 'text-energy-teal' : 'text-stardust'
                                    )}>
                                        {model.label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-stardust-dim">
                                    {model.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* "Why this model" Expandable Section - Only visible when Auto is selected */}
            {isAutoMode && autoRouterResult && (
                <div className="mt-2">
                    <button
                        onClick={() => setIsTraceExpanded(!isTraceExpanded)}
                        className="flex items-center gap-1 text-[10px] text-stardust-dim hover:text-stardust transition-colors"
                    >
                        {isTraceExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                        <Info className="w-3 h-3" />
                        <span>Why this model?</span>
                    </button>

                    {isTraceExpanded && (
                        <div className="mt-2 p-2.5 bg-void-soft/50 border border-glass-edge rounded-md text-[10px]">
                            {/* Selected Model Info */}
                            <div className="mb-2">
                                <span className="text-stardust-dim">Selected: </span>
                                <span className="text-energy-teal font-medium">
                                    {smartRouter.getModelDisplayName(autoRouterResult.selected.modelId)}
                                </span>
                                <span className="text-stardust-dim"> via </span>
                                <span className="text-stardust">
                                    {smartRouter.getProviderDisplayName(autoRouterResult.selected.providerId)}
                                </span>
                            </div>

                            {/* Reasons */}
                            {autoRouterResult.ranked[0]?.reasons && autoRouterResult.ranked[0].reasons.length > 0 && (
                                <div className="mb-2">
                                    <span className="text-stardust-dim block mb-1">Reasons:</span>
                                    <ul className="list-disc list-inside space-y-0.5 text-stardust-muted">
                                        {autoRouterResult.ranked[0].reasons.map((reason, idx) => (
                                            <li key={idx}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Alternatives */}
                            {autoRouterResult.ranked.length > 1 && (
                                <div className="mb-2">
                                    <span className="text-stardust-dim block mb-1">Alternatives:</span>
                                    <div className="space-y-1">
                                        {autoRouterResult.ranked.slice(1).map((alt, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-stardust-muted">
                                                <span>{smartRouter.getModelDisplayName(alt.modelId)}</span>
                                                <span className="text-stardust-dim">
                                                    {(alt.score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trace Notes */}
                            <details className="mt-2">
                                <summary className="cursor-pointer text-stardust-dim hover:text-stardust">
                                    Trace details
                                </summary>
                                <div className="mt-1 pt-1 border-t border-glass-edge space-y-0.5 text-stardust-muted">
                                    {autoRouterResult.trace.notes.map((note, idx) => (
                                        <div key={idx} className="font-mono">{note}</div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PromptArchitectFooter;

