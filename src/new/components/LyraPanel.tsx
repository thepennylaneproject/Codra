import { motion } from 'framer-motion';
import React, { useState, useCallback } from 'react';
import { useLyraOptional, ArtifactSuggestion, ClarifyingQuestion } from '../../lib/lyra';
import { ProductionDeskId, PRODUCTION_DESKS } from '../../domain/types';
import {
    Sparkles,
    ChevronRight,
    HelpCircle,
    Lightbulb,
    Play,
    X,
    Palette,
    PenTool,
    Code,
    LayoutTemplate,
    Megaphone,
    Briefcase,
    BarChart3,
    Settings,
} from 'lucide-react';
import { LyraAvatar } from './LyraAvatar';
import { LyraCustomizer } from './LyraCustomizer';

// ============================================
// Desk Icon Mapping
// ============================================

const DESK_ICONS: Record<ProductionDeskId, typeof Palette> = {
    'art-design': Palette,
    'engineering': Code,
    'writing': PenTool,
    'workflow': LayoutTemplate,
    'marketing': Megaphone,
    'career-assets': Briefcase,
    'data-analysis': BarChart3,
};

// ============================================
// Sub-components
// ============================================

// Memoized Question Item
const QuestionItem = React.memo(({ q, onDismiss }: { q: ClarifyingQuestion, onDismiss: (id: string) => void }) => (
    <div className="p-3 bg-zinc-50 rounded-lg group">
        <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-zinc-700">{q.question}</p>
            <button
                onClick={() => onDismiss(q.id)}
                className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-200 transition-all"
                title="Dismiss"
            >
                <X size={12} className="text-zinc-400" />
            </button>
        </div>
        <p className="text-xs text-zinc-400 mt-1">{q.context}</p>
    </div>
));

// Memoized Suggestion Item
const SuggestionItem = React.memo(({ s, onStart }: { s: ArtifactSuggestion, onStart: (id: ProductionDeskId) => void }) => {
    const DeskIcon = DESK_ICONS[s.deskId] || Sparkles;
    const desk = PRODUCTION_DESKS.find(d => d.id === s.deskId);

    return (
        <motion.button
            variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
            }}
            onClick={() => onStart(s.deskId)}
            className="w-full p-3 bg-zinc-50 hover:bg-zinc-100 rounded-lg text-left transition-colors group relative overflow-hidden"
        >
            <div className="flex items-center gap-3">
                <DeskIcon size={16} className="text-zinc-400 group-hover:text-zinc-600" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-700">{s.title}</p>
                        {s.integrationSource && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${s.integrationSource === 'sentry' ? 'bg-rose-500/10 text-rose-600' :
                                s.integrationSource === 'linear' ? 'bg-blue-500/10 text-blue-600' :
                                    s.integrationSource === 'sanity' ? 'bg-orange-500/10 text-orange-600' :
                                        'bg-zinc-500/10 text-zinc-600'
                                }`}>
                                {s.integrationSource}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-400">{desk?.label}</p>
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500" />
            </div>
        </motion.button>
    );
});

// ============================================
// Main Component
// ============================================

interface LyraPanelProps {
    onStartWithLyra?: (deskId: ProductionDeskId) => void;
    onDismissQuestion?: (questionId: string) => void;
}

export function LyraPanel({ onStartWithLyra, onDismissQuestion }: LyraPanelProps) {
    const lyra = useLyraOptional();
    const [isCustomizing, setIsCustomizing] = useState(false);

    const handleDismiss = useCallback((qid: string) => {
        if (lyra) {
            lyra.dismissQuestion(qid);
            onDismissQuestion?.(qid);
        }
    }, [lyra, onDismissQuestion]);

    const handleStart = useCallback((deskId: ProductionDeskId) => {
        onStartWithLyra?.(deskId);
    }, [onStartWithLyra]);

    // If Lyra context isn't available, show a minimal placeholder
    if (!lyra) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-50">
                <Sparkles size={32} className="text-zinc-300 mb-4" />
                <p className="text-sm text-zinc-400">Lyra will appear once your project is set up.</p>
            </div>
        );
    }

    const { state, suggestions, questions, hide } = lyra;

    // Don't render if hidden
    if (!state.visible) {
        return null;
    }

    if (isCustomizing) {
        return <LyraCustomizer onClose={() => setIsCustomizing(false)} />;
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className={`px-4 py-3 bg-white border-b border-zinc-100 flex items-center justify-between sticky top-0 z-10`}>
                <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer group" onClick={() => setIsCustomizing(true)}>
                        <LyraAvatar appearance={state.appearance} size={32} showGlow={false} />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Settings size={12} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold tracking-tight text-zinc-900">Lyra</span>
                            <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                        </div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Creative AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsCustomizing(true)}
                        className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-rose-500 transition-colors"
                        title="Lyra Closet"
                    >
                        <Settings size={14} />
                    </button>
                    <button
                        onClick={hide}
                        className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
                        title="Hide Lyra"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Clarifying Questions */}
                {questions.length > 0 && (
                    <section className="p-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2 mb-3">
                            <HelpCircle size={14} className="text-rose-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                Quick Questions
                            </span>
                        </div>
                        <div className="space-y-2">
                            {questions.slice(0, 3).map((q: ClarifyingQuestion) => (
                                <QuestionItem key={q.id} q={q} onDismiss={handleDismiss} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Suggested Artifacts */}
                {suggestions.length > 0 && (
                    <section className="p-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={14} className="text-amber-500" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                Suggested Next Steps
                            </span>
                        </div>
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.05 } }
                            }}
                            className="space-y-2"
                        >
                            {suggestions.slice(0, 5).map((s: ArtifactSuggestion) => (
                                <SuggestionItem key={s.id} s={s} onStart={handleStart} />
                            ))}
                        </motion.div>
                    </section>
                )}

                {/* Start with Lyra CTAs */}
                <section className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Play size={14} className="text-rose-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Task Workspaces
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {PRODUCTION_DESKS.map(desk => {
                            const DeskIcon = DESK_ICONS[desk.id] || Sparkles;

                            return (
                                <button
                                    key={desk.id}
                                    onClick={() => onStartWithLyra?.(desk.id)}
                                    className="p-3 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-lg transition-all group text-left"
                                >
                                    <DeskIcon size={16} className="text-zinc-400 mb-2 group-hover:text-zinc-600" />
                                    <p className="text-xs font-medium text-zinc-600">{desk.label}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Footer - Quick Actions */}
            <div className="p-3 border-t border-zinc-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onStartWithLyra?.('writing')}
                        className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg flex items-center justify-center gap-2 font-medium text-xs transition-colors"
                    >
                        <PenTool size={14} />
                        Draft Copy
                    </button>
                    <button
                        onClick={() => onStartWithLyra?.('art-design')}
                        className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg flex items-center justify-center gap-2 font-medium text-xs transition-colors"
                    >
                        <Palette size={14} />
                        Create Visual
                    </button>
                </div>
                <button
                    onClick={() => onStartWithLyra?.('workflow')}
                    className="w-full p-3 bg-[#1A1A1A] hover:bg-[#FF4D4D] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors shadow-sm"
                >
                    <Lightbulb size={14} />
                    Suggest Tasks
                </button>
            </div>
        </div>
    );
}
