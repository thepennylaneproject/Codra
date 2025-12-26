/**
 * FIRST-RUN MODAL
 * Welcome experience for new users, explaining Codra's core concepts
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Layers, Zap, ArrowRight, FileText, Palette } from 'lucide-react';

const SLIDES = [
    {
        icon: Sparkles,
        title: 'Welcome to Codra',
        description: 'Your AI-powered creative production studio. Design, write, and build with specialized AI assistants that understand your project context.',
        color: 'coral',
    },
    {
        icon: FileText,
        title: 'Project Brief',
        description: 'Every project starts with a Brief — your source of truth. It captures goals, audience, brand constraints, and success criteria so AI always has context.',
        color: 'amber',
    },
    {
        icon: Layers,
        title: 'Workspaces',
        description: 'Your Workspace is your canvas for each project. It shows your project sections, tasks, and lets you manage everything in one place.',
        color: 'blue',
    },
    {
        icon: Palette,
        title: 'Specialized Desks',
        description: 'Each Desk (Art, Writing, Engineering, etc.) is a focused environment with the right AI models and tools for that discipline.',
        color: 'purple',
    },
    {
        icon: Zap,
        title: 'Ready to Create',
        description: 'Start a project, review your Brief, then execute tasks. Iterate freely — nothing is final until you say so.',
        color: 'emerald',
    },
];

const COLOR_MAP: Record<string, string> = {
    coral: 'bg-[#FF4D4D] shadow-[#FF4D4D]/30',
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
                className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors z-10"
                        aria-label="Skip intro"
                    >
                        <X size={20} />
                    </button>

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
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
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
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide
                                            ? 'w-6 bg-zinc-900 dark:bg-zinc-100'
                                            : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                                        }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* Next/Done Button */}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            {currentSlide < SLIDES.length - 1 ? (
                                <>
                                    Next
                                    <ArrowRight size={16} />
                                </>
                            ) : (
                                <>
                                    Get Started
                                    <Sparkles size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
