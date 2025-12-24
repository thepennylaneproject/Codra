/**
 * LYRA CUSTOMIZER
 * Interface for modifying Lyra's visual appearance.
 * 
 * Features diversity controls: body shape, skin tone, hair, 
 * outfits, and accessories.
 */

import { useState } from 'react';
import { useLyra } from '../../lib/lyra/LyraContext';
import {
    LYRA_BASES,
    LYRA_HAIR,
    LYRA_CLOTHING,
    LYRA_ACCESSORIES,
    LYRA_EXPRESSIONS
} from '../../lib/lyra/LyraRegistry';
import { LyraExpression } from '../../domain/types';
import { X, Check, User, Scissors, Shirt, Sparkles, Smile } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function LyraCustomizer({ onClose }: { onClose: () => void }) {
    const { state, setAppearance } = useLyra();
    const [activeTab, setActiveTab] = useState<'base' | 'hair' | 'clothing' | 'accessory' | 'expression'>('base');

    const tabs = [
        { id: 'base', label: 'Body', icon: User },
        { id: 'hair', label: 'Hair', icon: Scissors },
        { id: 'clothing', label: 'Outfit', icon: Shirt },
        { id: 'accessory', label: 'Accessory', icon: Sparkles },
        { id: 'expression', label: 'Vibe', icon: Smile },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-white border-l border-zinc-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-4 py-4 border-b border-zinc-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Customizer</h3>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Phases of Lyra</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-100 rounded-full transition-colors"
                >
                    <X size={18} className="text-zinc-400" />
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-100 overflow-x-auto no-scrollbar">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center py-3 gap-1 transition-all border-b-2",
                                isActive
                                    ? "border-rose-500 bg-rose-50 text-rose-600"
                                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            <Icon size={16} />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Selection Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                    {/* Base Selection */}
                    {activeTab === 'base' && LYRA_BASES.map(base => (
                        <button
                            key={base.id}
                            onClick={() => setAppearance({ baseId: base.id })}
                            className={cn(
                                "relative aspect-square rounded-xl border-2 overflow-hidden transition-all group",
                                state.appearance.baseId === base.id
                                    ? "border-rose-500 ring-2 ring-rose-100"
                                    : "border-zinc-100 hover:border-zinc-300"
                            )}
                        >
                            <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center">
                                <img src={base.assetUrl} alt={base.label} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-1.5 border-t border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-600 truncate uppercase">{base.label}</p>
                            </div>
                            {state.appearance.baseId === base.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* Hair Selection */}
                    {activeTab === 'hair' && LYRA_HAIR.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setAppearance({ layers: { ...state.appearance.layers, hair: item.id } })}
                            className={cn(
                                "relative aspect-square rounded-xl border-2 overflow-hidden transition-all",
                                state.appearance.layers.hair === item.id
                                    ? "border-rose-500 ring-2 ring-rose-100"
                                    : "border-zinc-100 hover:border-zinc-300"
                            )}
                        >
                            <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center p-4">
                                <img src={item.assetUrl} alt={item.label} className="w-full h-full object-contain" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-1.5 border-t border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-600 truncate uppercase">{item.label}</p>
                            </div>
                            {state.appearance.layers.hair === item.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* Clothing Selection */}
                    {activeTab === 'clothing' && LYRA_CLOTHING.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setAppearance({ layers: { ...state.appearance.layers, clothing: item.id } })}
                            className={cn(
                                "relative aspect-square rounded-xl border-2 overflow-hidden transition-all",
                                state.appearance.layers.clothing === item.id
                                    ? "border-rose-500 ring-2 ring-rose-100"
                                    : "border-zinc-100 hover:border-zinc-300"
                            )}
                        >
                            <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center p-4">
                                <img src={item.assetUrl} alt={item.label} className="w-full h-full object-contain" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-1.5 border-t border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-600 truncate uppercase">{item.label}</p>
                            </div>
                            {state.appearance.layers.clothing === item.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* Accessory Selection */}
                    {activeTab === 'accessory' && (
                        <>
                            {/* None option */}
                            <button
                                onClick={() => setAppearance({ layers: { ...state.appearance.layers, accessory: null } })}
                                className={cn(
                                    "relative aspect-square rounded-xl border-2 border-dashed overflow-hidden transition-all flex flex-col items-center justify-center gap-1",
                                    state.appearance.layers.accessory === null
                                        ? "border-rose-500 bg-rose-50 text-rose-500"
                                        : "border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50"
                                )}
                            >
                                <X size={20} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">None</span>
                            </button>

                            {LYRA_ACCESSORIES.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setAppearance({ layers: { ...state.appearance.layers, accessory: item.id } })}
                                    className={cn(
                                        "relative aspect-square rounded-xl border-2 overflow-hidden transition-all",
                                        state.appearance.layers.accessory === item.id
                                            ? "border-rose-500 ring-2 ring-rose-100"
                                            : "border-zinc-100 hover:border-zinc-300"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-zinc-50 flex items-center justify-center p-4">
                                        <img src={item.assetUrl} alt={item.label} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-1.5 border-t border-zinc-100">
                                        <p className="text-[9px] font-bold text-zinc-600 truncate uppercase">{item.label}</p>
                                    </div>
                                    {state.appearance.layers.accessory === item.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </>
                    )}

                    {/* Expression Selection */}
                    {activeTab === 'expression' && LYRA_EXPRESSIONS.map(expr => (
                        <button
                            key={expr}
                            onClick={() => setAppearance({ expression: expr as LyraExpression })}
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                state.appearance.expression === expr
                                    ? "border-rose-500 bg-rose-50 text-rose-600"
                                    : "border-zinc-100 hover:border-zinc-300 text-zinc-500 bg-zinc-50"
                            )}
                        >
                            <img
                                src={`/assets/lyra/expressions/${expr}.svg`}
                                alt={expr}
                                className="w-8 h-8 opacity-60"
                                onError={(e) => (e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + expr)}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{expr}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100">
                <p className="text-[10px] text-zinc-400 leading-relaxed italic text-center">
                    "Aesthetic choices are editorial choices."
                </p>
            </div>
        </div>
    );
}
