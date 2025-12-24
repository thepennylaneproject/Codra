/**
 * MODEL SELECTOR PANEL
 * src/new/components/panels/ModelSelectorPanel.tsx
 * 
 * Provides granular control over model routing preferences.
 */

import { Cpu, Zap, Shield, Target, Info, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { SmartRouterQuality } from '../../../lib/ai/router/smart-router';

export function ModelSelectorPanel() {
    const { routingPreferences, updateRoutingPreferences, lastRoutingDecision } = useFlowStore();

    const qualities: { id: SmartRouterQuality; label: string; icon: any; description: string }[] = [
        {
            id: 'fast',
            label: 'Speed',
            icon: Zap,
            description: 'Prioritize low-latency responses using lightweight models.'
        },
        {
            id: 'balanced',
            label: 'Balanced',
            icon: Target,
            description: 'The optimal mix of cost, speed, and reasoning quality.'
        },
        {
            id: 'best',
            label: 'Reasoning',
            icon: Shield,
            description: 'Maximize precision and complex problem solving with premium models.'
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white text-[#1A1A1A] font-sans">
            <header className="p-4 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center">
                        <Cpu size={16} />
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">Engine Config</h2>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {/* Quality Selection */}
                <section className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">
                        Production Quality
                    </label>
                    <div className="space-y-2">
                        {qualities.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => updateRoutingPreferences({ quality: q.id })}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${routingPreferences.quality === q.id
                                    ? 'bg-[#1A1A1A] text-white border-transparent shadow-xl'
                                    : 'bg-white border-[#1A1A1A]/5 text-[#1A1A1A] hover:border-[#1A1A1A]/20 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <q.icon size={14} className={routingPreferences.quality === q.id ? 'text-[#FF4D4D]' : 'text-[#8A8A8A]'} />
                                    <span className="text-xs font-black uppercase tracking-widest">{q.label}</span>
                                </div>
                                <p className={`text-[10px] leading-relaxed ${routingPreferences.quality === q.id ? 'text-white/60' : 'text-[#8A8A8A]'
                                    }`}>
                                    {q.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Routing Transparency */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A8A8A]">
                            Active Routing
                        </label>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1A1A1A] text-white rounded-full">
                            <div className="w-1 h-1 rounded-full bg-[#00FF00] animate-pulse" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Live</span>
                        </div>
                    </div>

                    {lastRoutingDecision ? (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center font-black text-lg">
                                    {lastRoutingDecision.selected.modelId.substring(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#1A1A1A]">
                                        {lastRoutingDecision.selected.modelId.split('/').pop()}
                                    </h3>
                                    <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-tighter">
                                        Provider: {lastRoutingDecision.selected.providerId}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[9px] font-black text-[#8A8A8A] uppercase tracking-widest flex items-center gap-2">
                                    <Info size={10} />
                                    Decision Reasoning
                                </div>
                                <ul className="space-y-1.5">
                                    {lastRoutingDecision.ranked[0]?.reasons.map((reason, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[10px] font-medium text-zinc-600">
                                            <ChevronRight size={10} className="text-[#FF4D4D]" />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100">
                            <p className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-widest leading-relaxed">
                                No active production task.<br />Engine idling.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <footer className="p-4 bg-[#FFFAF0] border-t border-[#1A1A1A]/5">
                <div className="flex items-center justify-between text-[9px] font-bold text-[#8A8A8A] uppercase tracking-tight">
                    <span>Daily Spend Limit</span>
                    <span>$5.00</span>
                </div>
                <div className="mt-2 w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="w-1/4 h-full bg-[#FF4D4D]" />
                </div>
            </footer>
        </div>
    );
}
