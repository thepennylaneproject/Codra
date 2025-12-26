/**
 * PROMPT ARCHITECT PANEL
 * src/new/components/panels/PromptArchitectPanel.tsx
 * 
 * Rebuilt for the Unified Editorial pipeline.
 * Clean, "Ivory & Ink" style with Photonic Glass accents.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    MessageSquare,
    Search,
    Loader2,
    X,
    Check,
    ChevronDown,
    ShieldCheck,
    Cpu,
    Target,
    Calculator,
    Info,
    Sparkles
} from 'lucide-react';
import { usePromptArchitectStore } from '../../../lib/prompt-architect/prompt-architect-store';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { smartRouter, mapOutputTypeToTaskType, mapModeToQuality } from '../../../lib/ai/router/smart-router';
import { THINKING_MODES, ThinkingMode } from '../../../lib/strategy/thinking-modes';
import { useAuthenticity } from '../../../lib/copy/useAuthenticity';


export function PromptArchitectPanel() {
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

    const [isVisible, setIsVisible] = useState(true);
    const [showRoutingTrace, setShowRoutingTrace] = useState(false);
    const [thinkingMode, setThinkingMode] = useState<ThinkingMode>('convergent');
    
    // P2: Authenticity Detection
    const { analyze, score, grade, issues } = useAuthenticity();

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

    return (
        <div className="flex flex-col h-full text-[#1A1A1A] font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A]/5 bg-[#FFFAF0]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white shadow-lg shadow-[#1A1A1A]/10">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                            Prompt Architect
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                                System v4.2
                            </span>
                            <div className="w-1 h-1 rounded-full bg-[#FF4D4D]" />
                            <span className="text-[10px] font-bold text-[#FF4D4D] uppercase tracking-wider">
                                {status === 'idle' ? 'Ready' : status === 'analyzing' ? 'Analyzing' : status === 'needs-clarification' ? 'Clarification Required' : 'Ready'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsVisible(!isVisible)}
                        className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-lg transition-colors"
                    >
                        <ChevronDown size={14} className={isVisible ? '' : '-rotate-90'} />
                    </button>
                    <button className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-lg transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
                    >
                        <div className="p-4 space-y-6">
                            {/* Intent Input Section */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">
                                        Editorial Intent
                                    </label>
                                    <div className="flex items-center gap-2 p-1 bg-[#1A1A1A]/5 rounded-lg">
                                        {(['fast', 'precise', 'production'] as const).map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => setMode(m)}
                                                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all ${mode === m
                                                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                                                    : 'text-[#8A8A8A] hover:text-[#1A1A1A]'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative group">
                                    <textarea
                                        value={intent}
                                        onChange={(e) => setIntent(e.target.value)}
                                        placeholder="State your intent... (e.g., 'Generate a cinematic intro for a workspace overview')"
                                        className="w-full min-h-[120px] p-4 bg-white border border-[#1A1A1A]/10 rounded-2xl text-sm focus:outline-none focus:border-[#1A1A1A] transition-all resize-none shadow-sm group-hover:shadow-md"
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                        <button
                                            onClick={() => setGroundingEnabled(!groundingConfig.enabled)}
                                            className={`p-2 rounded-xl border transition-all ${groundingConfig.enabled
                                                ? 'bg-[#1A1A1A] text-white border-transparent'
                                                : 'bg-white text-[#8A8A8A] border-[#1A1A1A]/10 hover:border-[#1A1A1A]'
                                                }`}
                                            title="Toggle Knowledge Grounding"
                                        >
                                            <Search size={14} />
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={!intent.trim() || isGenerating}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 ${!intent.trim() || isGenerating
                                                ? 'bg-[#1A1A1A]/10 text-[#8A8A8A] cursor-not-allowed'
                                                : 'bg-[#1A1A1A] text-white hover:bg-[#FF4D4D] shadow-[#1A1A1A]/10'
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Target size={14} />
                                            )}
                                            {status === 'needs-clarification' ? 'Re-Generate' : 'Architect'}
                                        </button>
                                    </div>
                                </div>

                                {/* Thinking Mode Selector */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={12} className="text-[#8A8A8A]" />
                                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">
                                            Thinking Mode
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(Object.keys(THINKING_MODES) as ThinkingMode[]).map((modeKey) => {
                                            const mConfig = THINKING_MODES[modeKey];
                                            return (
                                                <button
                                                    key={modeKey}
                                                    onClick={() => setThinkingMode(modeKey)}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                                        thinkingMode === modeKey
                                                            ? 'bg-[#1A1A1A] text-white border-transparent shadow-lg'
                                                            : 'bg-white text-[#8A8A8A] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30'
                                                    }`}
                                                    title={mConfig.description}
                                                >
                                                    <span className="text-lg">{mConfig.icon}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-wider">{mConfig.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {thinkingMode !== 'convergent' && (
                                        <p className="text-[9px] text-[#8A8A8A] italic pl-1">
                                            {THINKING_MODES[thinkingMode].description}
                                        </p>
                                    )}
                                </div>

                                {/* Routing Decision View */}
                                <AnimatePresence>
                                    {intent.trim() && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-4 bg-white border border-[#1A1A1A]/5 rounded-2xl space-y-3 shadow-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Cpu size={14} className="text-[#8A8A8A]" />
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">Router Decision</h4>
                                                </div>
                                                {lastRoutingDecision && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FF4D4D]/5 text-[#FF4D4D] rounded-full border border-[#FF4D4D]/10">
                                                        <Calculator size={10} />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">
                                                            Est. ${(lastRoutingDecision.ranked[0]?.score * 0.005).toFixed(3)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {lastRoutingDecision ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-[#FFFAF0] rounded-xl border border-[#1A1A1A]/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center font-black text-[10px]">
                                                                {lastRoutingDecision.selected.modelId.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-[11px] font-black text-[#1A1A1A]">
                                                                    {smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId)}
                                                                </div>
                                                                <div className="text-[9px] font-bold text-[#8A8A8A] uppercase tracking-tighter">
                                                                    via {smartRouter.getProviderDisplayName(lastRoutingDecision.selected.providerId)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowRoutingTrace(!showRoutingTrace)}
                                                            className="p-1.5 hover:bg-[#1A1A1A]/5 rounded-lg transition-colors text-[#8A8A8A]"
                                                        >
                                                            <Info size={14} />
                                                        </button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {showRoutingTrace && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden"
                                                            >
                                                                <div className="text-[9px] font-black text-[#8A8A8A] uppercase tracking-widest mb-2 border-b border-zinc-200 pb-1">Routing Trace</div>
                                                                <ul className="space-y-1">
                                                                    {lastRoutingDecision.trace.notes.slice(0, 4).map((note, idx) => (
                                                                        <li key={idx} className="text-[10px] text-zinc-500 font-medium leading-tight">
                                                                            • {note}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <div className="mt-3 pt-2 border-t border-zinc-200">
                                                                    <div className="text-[9px] font-black text-[#8A8A8A] uppercase tracking-widest mb-1.5">Model Scoring</div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {lastRoutingDecision.ranked.slice(0, 4).map((rank) => (
                                                                            <div key={rank.modelId} className="flex items-center justify-between text-[9px] font-bold">
                                                                                <span className="text-zinc-400">{rank.modelId.split('/').pop()}</span>
                                                                                <span className="text-[#FF4D4D]">{(rank.score * 100).toFixed(0)}%</span>
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
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">Analyzing context for routing...</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </section>

                            {/* Clarification Section */}
                            <AnimatePresence>
                                {status === 'needs-clarification' && clarificationQuestions.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-5 bg-white border border-[#FF4D4D]/10 rounded-2xl space-y-5 shadow-sm overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 text-[#FF4D4D]">
                                            <MessageSquare size={14} fill="currentColor" fillOpacity={0.2} />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em]">
                                                Required Clarifications
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            {clarificationQuestions.map((q) => (
                                                <div key={q.id} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold text-[#5A5A5A]">
                                                            {q.question}
                                                            {q.required && <span className="text-[#FF4D4D] ml-1">*</span>}
                                                        </label>
                                                    </div>
                                                    {q.options && q.options.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.options.map((opt) => (
                                                                <button
                                                                    key={opt}
                                                                    onClick={() => answerClarification(q.id, opt)}
                                                                    className="px-3 py-1.5 text-[10px] font-bold rounded-lg border bg-white border-[#1A1A1A]/10 text-[#5A5A5A] hover:border-[#1A1A1A] transition-all"
                                                                >
                                                                    {opt}
                                                                </button>
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

                            {/* Output Section */}
                            <AnimatePresence>
                                {generatedPrompt && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">
                                                    Draft Output
                                                </label>
                                                {/* P2: Authenticity Badge */}
                                                {grade && (
                                                    <button
                                                        onClick={() => analyze(generatedPrompt?.primary || '')}
                                                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                            grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                            grade === 'B' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            grade === 'C' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                            grade === 'D' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            'bg-red-50 text-red-600 border-red-200'
                                                        }`}
                                                        title={issues.length > 0 ? `${issues.length} AI patterns detected` : 'Authentic content'}
                                                    >
                                                        <span>{grade}</span>
                                                        <span className="opacity-60">{score}%</span>
                                                    </button>
                                                )}
                                                {!grade && generatedPrompt && (
                                                    <button
                                                        onClick={() => analyze(generatedPrompt.primary)}
                                                        className="px-2 py-0.5 rounded-full text-[9px] font-bold text-[#8A8A8A] bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 transition-colors"
                                                    >
                                                        Check Authenticity
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {(['prompt', 'system', 'negative', 'sources'] as const).map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab)}
                                                        className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                                            ? 'text-[#1A1A1A] border-b-2 border-[#FF4D4D] pb-1'
                                                            : 'text-[#8A8A8A] hover:text-[#5A5A5A]'
                                                            }`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white border border-[#1A1A1A]/10 rounded-2xl overflow-hidden shadow-sm">
                                            {activeTab === 'prompt' && (
                                                <div className="p-5 space-y-4">
                                                    <div className="space-y-2">
                                                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8A8A]">Primary Prompt</h4>
                                                        <p className="text-sm font-medium leading-relaxed text-[#1A1A1A]">
                                                            {generatedPrompt.primary}
                                                        </p>
                                                    </div>
                                                    {generatedPrompt.system && (
                                                        <div className="space-y-2 pt-4 border-t border-[#1A1A1A]/5">
                                                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8A8A]">System Instructions</h4>
                                                            <p className="text-xs text-[#5A5A5A] italic">
                                                                {generatedPrompt.system}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === 'sources' && (
                                                <div className="p-5 text-center py-12 opacity-40">
                                                    <Search size={32} className="mx-auto mb-4" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">Knowledge Sources Ready</p>
                                                </div>
                                            )}

                                            <div className="px-5 py-4 bg-[#FFFAF0] border-t border-[#1A1A1A]/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center">
                                                            <Cpu size={10} />
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-white flex items-center justify-center text-white">
                                                            <span className="text-[8px] uppercase">{lastRoutingDecision?.selected.modelId.substring(0, 2) || 'AI'}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#8A8A8A]">
                                                        Optimized for {lastRoutingDecision ? smartRouter.getModelDisplayName(lastRoutingDecision.selected.modelId) : 'Advanced AI'}
                                                    </span>
                                                </div>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-[#FF4D4D] transition-all active:scale-95">
                                                    <Check size={12} strokeWidth={3} />
                                                    Commit
                                                </button>
                                            </div>
                                        </div>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Signature */}
            <div className="p-4 bg-[#FFFAF0] border-t border-[#1A1A1A]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-[#8A8A8A]" />
                    <span className="text-[9px] font-bold text-[#8A8A8A] uppercase tracking-tighter">
                        Architect Guardrails Active
                    </span>
                </div>
                <div className="w-12 h-px bg-[#1A1A1A]/10" />
            </div>
        </div>
    );
}
