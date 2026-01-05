/**
 * LYRA RECALL BUTTON
 * Floating button to recall Lyra when she's hidden
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLyraOptional } from '../../lib/lyra';

export function LyraRecallButton() {
    const lyra = useLyraOptional();

    // Only show when Lyra context exists and is hidden
    if (!lyra || lyra.state.visible) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={lyra.show}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-[#1A1A1A] hover:bg-zinc-600 text-white shadow-xl shadow-[#1A1A1A]/20 flex items-center justify-center transition-colors group"
                title="Open Lyra module"
            >
                <Sparkles size={24} className="group-hover:animate-pulse" />

                {/* Tooltip */}
                <span className="absolute right-full mr-3 px-3 py-1 bg-[#1A1A1A] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Open Lyra module
                </span>
            </motion.button>
        </AnimatePresence>
    );
}
