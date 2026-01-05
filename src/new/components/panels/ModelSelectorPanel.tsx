/**
 * MODEL SELECTOR PANEL
 * src/new/components/panels/ModelSelectorPanel.tsx
 * 
 * Provides granular control over model routing preferences.
 */

import { Cpu, Zap, Shield, Target, Info, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../../lib/store/useFlowStore';
import { SmartRouterQuality } from '../../../lib/ai/router/smart-router';
import { Button } from '@/components/ui/Button';

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
        <div className="flex flex-col h-full bg-white text-text-primary font-sans">
            <header className="p-4 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center">
                        <Cpu size={16} />
                    </div>
                    <h2 className="text-xs font-semibold">Engine Config</h2>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {/* Quality Selection */}
                <section className="space-y-4">
                    <label className="text-xs font-semibold text-text-soft">Production Quality</label>
                    <div className="space-y-2">
                        {qualities.map((q) => (
                            <Button
                                key={q.id}
                                onClick={() => updateRoutingPreferences({ quality: q.id })}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${routingPreferences.quality === q.id
                                    ? 'bg-[#1A1A1A] text-white border-transparent shadow-xl'
                                    : 'bg-white border-[#1A1A1A]/5 text-text-primary hover:border-[#1A1A1A]/20 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <q.icon size={14} className={routingPreferences.quality === q.id ? 'text-zinc-500' : 'text-text-soft'} />
                                    <span className="text-xs font-semibold">{q.label}</span>
                                </div>
                                <p className={`text-xs leading-relaxed ${routingPreferences.quality === q.id ? 'text-white/60' : 'text-text-soft'
                                    }`}>
                                    {q.description}
                                </p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Routing Transparency */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-text-soft">Routing Transparency</label>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-[#1A1A1A] text-white rounded-full">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            <span className="text-xs font-semibold">Live</span>
                        </div>
                    </div>
                    {lastRoutingDecision ? (
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center font-semibold text-base">
                                    {lastRoutingDecision.selected.modelId.substring(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        {lastRoutingDecision.selected.modelId.split('/').pop()}
                                    </h3>
                                    <p className="text-xs font-semibold text-text-soft">
                                        Provider: {lastRoutingDecision.selected.providerId}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-text-soft flex items-center gap-2">
                                    <Info size={10} />
                                    <span>Decision factors</span>
                                </div>
                                <ul className="space-y-1">
                                    {lastRoutingDecision.ranked[0]?.reasons.map((reason, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                                            <ChevronRight size={10} className="text-zinc-500" />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-zinc-100">
                            <p className="text-xs font-semibold text-text-soft leading-relaxed">
                                No active production task.<br />Engine idling.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <footer className="p-4 bg-[#FFFAF0] border-t border-[#1A1A1A]/5">
                <div className="flex items-center justify-between text-xs font-semibold text-text-soft tracking-tight">
                    <span>Daily Spend Limit</span>
                    <span>$5.00</span>
                </div>
                <div className="mt-2 h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-zinc-600" />
                </div>
            </footer>
        </div>
    );
}
