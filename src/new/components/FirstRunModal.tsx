/**
 * FIRST-RUN MODAL
 * Welcome experience for new users, explaining Codra's core concepts
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Layers, Zap, ArrowRight, FileText, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const SLIDES = [
    {
        icon: Sparkles,
        title: 'Codra system overview',
        description: 'Orchestrate asset, content, and code pipelines with configured models and project context.',
        color: 'coral',
    },
    {
        icon: FileText,
        title: 'Project Brief',
        description: 'Each project uses a Brief as the source of truth for goals, audience, brand constraints, and success criteria.',
        color: 'amber',
    },
    {
        icon: Layers,
        title: 'Workspaces',
        description: 'Workspace is the primary execution surface for sections and tasks.',
        color: 'blue',
    },
    {
        icon: Palette,
        title: 'Specialized Desks',
        description: 'Each desk maps to a function with configured models and tools for that discipline.',
        color: 'purple',
    },
    {
        icon: Zap,
        title: 'Execution idle',
        description: 'Start a project, review the Brief, then execute tasks. Revisions remain editable until approval.',
        color: 'emerald',
    },
];

const COLOR_MAP: Record<string, string> = {
    coral: 'bg-zinc-600 shadow-zinc-500/30',
    amber: 'bg-amber-500 shadow-amber-500/30',
    blue: 'bg-blue-500 shadow-blue-500/30',
    purple: 'bg-purple-500 shadow-purple-500/30',
    emerald: 'bg-emerald-500 shadow-emerald-500/30',
};

const STORAGE_KEY = 'codra:firstRunDismissed';

export function FirstRunModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        // Check if user has dismissed before
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
            setIsOpen(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsOpen(false);
    };

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleDismiss();
        }
    };

    if (!isOpen) return null;

    const slide = SLIDES[currentSlide];
    const Icon = slide.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] flex items-center justify-center glass-panel border-0 rounded-none bg-black/50"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                >
                    {/* Close Button */}
                    <Button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors z-10"
                        aria-label="Close overview"
                    >
                        <X size={20} />
                    </Button>

                    {/* Content */}
                    <div className="p-8 pt-12 text-center">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Icon */}
                            <div className={`inline-flex p-4 rounded-2xl ${COLOR_MAP[slide.color]} text-white shadow-lg`}>
                                <Icon size={32} />
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                {slide.title}
                            </h2>

                            {/* Description */}
                            <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                {slide.description}
                            </p>
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        {/* Progress Dots */}
                        <div className="flex gap-2">
                            {SLIDES.map((_, idx) => (
                                <Button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide
                                            ? 'w-6 bg-zinc-900 dark:bg-zinc-100'
                                            : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                                        }`}
                                    aria-label={`Open slide ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* Next/Done Button */}
                        <Button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            {currentSlide < SLIDES.length - 1 ? (
                                <>
                                    Open next step
                                    <ArrowRight size={16} />
                                </>
                            ) : (
                                <>
                                    Close overview
                                    <Sparkles size={16} />
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
