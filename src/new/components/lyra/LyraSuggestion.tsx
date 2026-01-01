/**
 * LYRA SUGGESTION
 * Single-purpose suggestion display with primary CTA and dismiss action
 */

import { motion } from 'framer-motion';

export interface LyraSuggestionProps {
    text: string;
    action: {
        label: string;
        taskId: string;
    };
    onExecute: (taskId: string) => void;
    onDismiss: () => void;
    isExecuting?: boolean;
}

export function LyraSuggestion({
    text,
    action,
    onExecute,
    onDismiss,
    isExecuting = false,
}: LyraSuggestionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
        >
            {/* Suggestion Text */}
            <p className="text-sm text-zinc-300 leading-relaxed">
                {text}
            </p>

            {/* Primary CTA */}
            <button
                onClick={() => onExecute(action.taskId)}
                disabled={isExecuting}
                className="w-full px-4 py-3 bg-[#FF6B6B] hover:bg-[#FF5252] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors"
            >
                {isExecuting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {action.label}
                    </span>
                ) : (
                    action.label
                )}
            </button>

            {/* Dismiss Button */}
            <button
                onClick={onDismiss}
                disabled={isExecuting}
                className="w-full px-4 py-2 border border-zinc-700 hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-300 text-sm rounded-lg transition-colors"
            >
                Dismiss
            </button>
        </motion.div>
    );
}
