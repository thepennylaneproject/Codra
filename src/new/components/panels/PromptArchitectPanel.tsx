/**
 * PROMPT ARCHITECT PANEL
 * src/new/components/panels/PromptArchitectPanel.tsx
 * 
 * Rebuilt for the Unified Editorial pipeline.
 * Clean, "Ivory & Ink" style with Photonic Glass accents.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Loader2,
    Check,
    Cpu,
    Target,
    Info,
    Sparkles
} from 'lucide-react';
import { usePromptArchitectStore } from '../../../lib/prompt-architect/prompt-architect-store';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { smartRouter, mapOutputTypeToTaskType, mapModeToQuality } from '../../../lib/ai/router/smart-router';
import { costEngine } from '../../../lib/ai/cost';
import { THINKING_MODES, ThinkingMode } from '../../../lib/strategy/thinking-modes';
import { useAuthenticity } from '../../../lib/copy/useAuthenticity';
import { Button, IconButton } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CostExplainerWidget } from '../../../components/cost/CostExplainerWidget';
import { analytics } from '../../../lib/analytics';
import { DEFAULT_MODEL } from '../../../lib/prompt-architect/types';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/feature-flags';


interface PromptArchitectPanelProps {
    variant?: 'compact' | 'full';
}

export function PromptArchitectPanel({ variant = 'full' }: PromptArchitectPanelProps) {
    const {
        intent,
        setIntent,
        status,
        isGenerating,
        generatePrompt,
        mode,
        setMode,
        clarificationQuestions,
        answerClarification,
        generatedPrompt,
        activeTab,
        setActiveTab,
        groundingConfig,
        setGroundingEnabled
    } = usePromptArchitectStore();

    const {
        routingPreferences,
        lastRoutingDecision,
        setLastRoutingDecision
    } = useFlowStore();

    const [showRoutingTrace, setShowRoutingTrace] = useState(false);
    const [thinkingMode, setThinkingMode] = useState<ThinkingMode>('convergent');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const showCostExplainer = useFeatureFlag(FEATURE_FLAGS.MODEL_COST_EXPLAINER);

    const taskType = mapOutputTypeToTaskType(activeTab);

    // Analytics: View Explainer
    useEffect(() => {
        analytics.track('model_explainer_viewed', {
            modelId: lastRoutingDecision?.selected.modelId,
            taskType,
            mode
        });
    }, [lastRoutingDecision?.selected.modelId, taskType, mode]);
    
    // P2: Authenticity Detection
    const { analyze, score, grade } = useAuthenticity();
    const estimatedCost = lastRoutingDecision
        ? (lastRoutingDecision.ranked[0]?.score * 0.005).toFixed(3)
        : null;
    const authenticityMeta = grade ? `Authenticity ${grade} · ${score}%` : 'Authenticity not checked';

    // Update routing decision when intent or mode changes
    useEffect(() => {
        if (!intent.trim()) {
            setLastRoutingDecision(null);
            return;
        }

        const taskType = mapOutputTypeToTaskType(activeTab);
        const quality = mapModeToQuality(mode);

        const decision = smartRouter.route({
            taskType,
            quality,
            maxCostUsd: routingPreferences.maxCostPerTask || undefined,
            allowedProviders: routingPreferences.allowedProviders.length > 0 ? routingPreferences.allowedProviders : undefined
        });

        setLastRoutingDecision(decision);
    }, [intent, mode, activeTab, routingPreferences, setLastRoutingDecision]);

    const handleGenerate = () => {
        generatePrompt();
    };

    const starterSuggestions = [
        'Build a workflow that…',
        'Draft a plan for…'
    ];

    const handleSuggestionClick = (text: string) => {
        setIntent(text);
        requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (!el) return;
            el.focus();
            el.setSelectionRange(text.length, text.length);
        });
    };

    const intentSection = (
        <section className="space-y-[var(--space-md)]">
            <SectionHeader
                title="Intent"
                meta={variant === 'full' ? 'Describe the task and choose an execution mode.' : undefined}
                className={`mt-0 ${variant === 'compact' ? 'section-header-subtle' : ''}`}
            />
            <div className="space-y-[var(--space-xs)]">
                <p className="text-section text-text-primary">What are you building?</p>
                <p className="text-helper text-text-soft max-w-[42ch]">Rough input is enough to start.</p>
            </div>
            {variant === 'full' && (
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-soft">Execution mode</span>
                    <div className="flex items-center gap-2 p-1 bg-[#1A1A1A]/5 rounded-lg">
                        {(['fast', 'precise', 'production'] as const).map((m) => (
                            <Button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                    mode === m
                                        ? 'bg-white text-text-primary shadow-sm'
                                        : 'text-text-soft hover:text-text-primary'
                                }`}
                            >
                                {m}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {variant === 'full' && showCostExplainer && (
                <CostExplainerWidget 
                    modelId={lastRoutingDecision?.selected.modelId || DEFAULT_MODEL}
                    taskType={taskType}
                    onModelChange={(modelId: string) => {
                        setLastRoutingDecision({
                            ...lastRoutingDecision!,
                            selected: {
                                modelId,
                                providerId: costEngine.getModelPricing(modelId)?.provider || 'aimlapi'
                            }
                        });
                        analytics.track('model_selected_override', {
                            modelId,
                            previousModelId: lastRoutingDecision?.selected.modelId,
                            taskType
                        });
                    }}
                />
            )}

            <div className="relative group">
                <textarea
                    ref={textareaRef}
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="State your intent..."
                    className="w-full min-h-[120px] p-4 bg-white/70 border border-[#1A1A1A]/10 rounded-2xl text-[13px] leading-relaxed focus:outline-none focus:border-[#1A1A1A] transition-all resize-none"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {variant === 'full' && (
                        <Button
                            onClick={() => setGroundingEnabled(!groundingConfig.enabled)}
                            className={`p-2 rounded-xl border transition-all ${groundingConfig.enabled
                                ? 'bg-[#1A1A1A] text-white border-transparent'
                                : 'bg-white text-text-soft border-[#1A1A1A]/10 hover:border-[#1A1A1A]'
                                }`}
                            title="Toggle Knowledge Grounding"
                        >
                            <Search size={14} />
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={!intent.trim() || isGenerating}
                        leftIcon={isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                        className="shadow-none px-4"
                    >
                        {status === 'needs-clarification' ? 'Re-architect' : 'Architect'}
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-[var(--space-sm)]">
                {starterSuggestions.map((text) => (
                    <button
                        key={text}
                        type="button"
                        onClick={() => handleSuggestionClick(text)}
                        className="text-helper text-text-soft hover:text-text-primary underline decoration-transparent hover:decoration-[var(--ui-border)] transition-colors"
                    >
                        {text}
                    </button>
                ))}
            </div>
        </section>
    );

    return (
        <div className="flex flex-col h-full text-text-primary font-sans">
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="p-[var(--space-md)] space-y-[var(--space-lg)]">
                    {intentSection}

                    {variant === 'full' && (
                        <>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={12} className="text-text-soft" />
                                    <label className="text-xs font-semibold text-text-soft">Thinking mode</label>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {(Object.keys(THINKING_MODES) as ThinkingMode[]).map((modeKey) => {
                                        const mConfig = THINKING_MODES[modeKey];
                                        return (
                                            <Button
                                                key={modeKey}
                                                onClick={() => setThinkingMode(modeKey)}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                                    thinkingMode === modeKey
                                                        ? 'bg-[#1A1A1A] text-white border-transparent shadow-lg'
                                                        : 'bg-white text-text-soft border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30'
                                                }`}
                                                title={mConfig.description}
                                            >
                                                <span className="text-base">{mConfig.icon}</span>
                                                <span className="text-xs font-semibold">{mConfig.name}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <AnimatePresence>
                                {intent.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-4 bg-white border border-[#1A1A1A]/5 rounded-2xl space-y-3 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Cpu size={14} className="text-text-soft" />
                                                    <SectionHeader
                                                        title="Routing decision"
                                                        meta={estimatedCost ? `Est. $${estimatedCost}` : undefined}
                                                        className="mt-0 mb-4"
                                                    />
                                                </div>
                                            </div>

                                            {lastRoutingDecision ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-[#FFFAF0] rounded-xl border border-[#1A1A1A]/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center font-semibold text-xs">
                                                                {lastRoutingDecision.selected.modelId.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-semibold text-text-primary">
                                                                    {smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId)}
                                                                </div>
                                                                <div className="text-xs font-semibold text-text-soft">
                                                                    via {smartRouter.getProviderDisplayName(lastRoutingDecision.selected.providerId)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <IconButton
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowRoutingTrace(!showRoutingTrace)}
                                                            aria-label="Show routing trace"
                                                            className="text-text-soft"
                                                        >
                                                            <Info size={14} />
                                                        </IconButton>
                                                    </div>

                                                    <AnimatePresence>
                                                        {showRoutingTrace && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden"
                                                            >
                                                                <div className="text-xs font-semibold text-text-soft mb-2 border-b border-zinc-200 pb-1">Routing Trace</div>
                                                                <ul className="space-y-1">
                                                                    {(lastRoutingDecision.trace?.notes || []).slice(0, 4).map((note: string, idx: number) => (
                                                                        <li key={idx} className="text-xs text-zinc-500 font-medium leading-tight">
                                                                            • {note}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <div className="mt-3 pt-2 border-t border-zinc-200">
                                                                    <div className="text-xs font-semibold text-text-soft mb-1">Model Scoring</div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {(lastRoutingDecision.ranked || []).map((rank) => (
                                                                            <div key={rank.modelId} className="flex items-center justify-between text-xs font-semibold">
                                                                                <span className="text-zinc-400">{rank.modelId.split('/').pop()}</span>
                                                                                <span className="text-zinc-500">{(rank.score * 100).toFixed(0)}%</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                                                    <p className="text-xs font-semibold text-zinc-400 leading-relaxed">Analyzing context for routing...</p>
                                                </div>
                                            )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {status === 'needs-clarification' && clarificationQuestions.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-white border border-zinc-300/60 rounded-2xl space-y-4 shadow-sm overflow-hidden"
                                    >
                                        <SectionHeader
                                            title="Clarifications"
                                            meta="Required details before generating."
                                            className="mt-0"
                                        />
                                        <div className="space-y-4">
                                            {clarificationQuestions.map((q) => (
                                                <div key={q.id} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-semibold text-text-secondary">
                                                            {q.question}
                                                            {q.required && <span className="text-zinc-500 ml-1">*</span>}
                                                        </label>
                                                    </div>
                                                    {q.options && q.options.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.options.map((opt) => (
                                                                <Button
                                                                    key={opt}
                                                                    onClick={() => answerClarification(q.id, opt)}
                                                                    className="px-3 py-1 text-xs font-semibold rounded-lg border bg-white border-[#1A1A1A]/10 text-text-secondary hover:border-[#1A1A1A] transition-all"
                                                                >
                                                                    {opt}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Enter detail..."
                                                            className="w-full px-4 py-2 bg-[#1A1A1A]/5 rounded-xl text-xs focus:outline-none focus:bg-[#1A1A1A]/10 transition-all"
                                                            onBlur={(e) => answerClarification(q.id, e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {generatedPrompt && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <SectionHeader title="Draft Output" meta={authenticityMeta} className="mt-0" />
                                                {generatedPrompt && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => analyze(generatedPrompt.primary)}
                                                        className="px-0 py-0 text-xs font-semibold text-text-soft hover:text-text-primary hover:bg-transparent"
                                                    >
                                                        {grade ? 'Recheck authenticity' : 'Check authenticity'}
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {(['prompt', 'system', 'negative', 'sources'] as const).map((tab) => (
                                                    <Button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab)}
                                                        className={`text-xs font-semibold transition-all ${activeTab === tab
                                                            ? 'text-text-primary border-b-2 border-zinc-400 pb-1'
                                                            : 'text-text-soft hover:text-text-secondary'
                                                            }`}
                                                    >
                                                        {tab}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white border border-[#1A1A1A]/10 rounded-2xl overflow-hidden shadow-sm">
                                            {activeTab === 'prompt' && (
                                                <div className="p-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-text-soft">Primary Prompt</h4>
                                                        <p className="text-sm font-medium leading-relaxed text-text-primary">
                                                            {generatedPrompt.primary}
                                                        </p>
                                                    </div>
                                                    {generatedPrompt.system && (
                                                        <div className="space-y-2 pt-4 border-t border-[#1A1A1A]/5">
                                                            <h4 className="text-xs font-semibold text-text-soft">System Instructions</h4>
                                                            <p className="text-xs text-text-secondary italic">
                                                                {generatedPrompt.system}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === 'sources' && (
                                                <div className="p-4 text-center py-12 opacity-40">
                                                    <Search size={32} className="mx-auto mb-4" />
                                                    <p className="text-xs font-semibold">Knowledge sources idle</p>
                                                </div>
                                            )}

                                            <div className="px-4 py-4 bg-[#FFFAF0] border-t border-[#1A1A1A]/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-xs font-semibold">
                                                    <div className="flex space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center">
                                                            <Cpu size={10} />
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-white flex items-center justify-center text-white">
                                                            <span className="text-xs">{lastRoutingDecision?.selected.modelId.substring(0, 2) || 'AI'}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-text-soft">
                                                        Optimized for {lastRoutingDecision ? smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId) : 'Advanced AI'}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled
                                                    leftIcon={<Check size={12} strokeWidth={3} />}
                                                >
                                                    Unavailable
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
