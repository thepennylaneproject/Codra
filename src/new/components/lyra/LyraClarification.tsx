/**
 * LYRA CLARIFICATION
 * Multi-choice question display (max 3 options)
 */

import { motion } from 'framer-motion';

export interface ClarificationOption {
    label: string;
    value: string;
}

export interface LyraClarificationProps {
    text: string;
    options: ClarificationOption[];
    onSelect: (value: string) => void;
}

export function LyraClarification({
    text,
    options,
    onSelect,
}: LyraClarificationProps) {
    // Enforce max 3 options
    const displayOptions = options.slice(0, 3);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
        >
            {/* Question Text */}
            <p className="text-sm text-zinc-300 leading-relaxed">
                {text}
            </p>

            {/* Options */}
            <div className="flex flex-col gap-2">
                {displayOptions.map((option, index) => (
                    <motion.button
                        key={option.value}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelect(option.value)}
                        className="px-4 py-3 border border-zinc-700 hover:border-zinc-400 hover:bg-zinc-200/50 text-zinc-300 hover:text-white text-sm rounded-lg transition-all text-left"
                    >
                        {option.label}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
