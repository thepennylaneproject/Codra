import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import type { SaveState } from '@/hooks/useAutoSave';

export interface SaveIndicatorProps {
  state: SaveState;
  onRetry?: () => void;
}

export function SaveIndicator({ state, onRetry }: SaveIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {state === 'saving' && (
        <motion.span
          key="saving"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5 text-xs text-zinc-500"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </motion.span>
      )}
      
      {state === 'saved' && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5 text-xs text-emerald-600"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 500,
              damping: 15
            }}
          >
            <Check className="w-3 h-3" />
          </motion.div>
          <span>Saved</span>
        </motion.span>
      )}
      
      {state === 'error' && (
        <motion.button
          key="error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          type="button"
        >
          <X className="w-3 h-3" />
          <span>Run retry</span>
        </motion.button>
      )}
      
      {state === 'idle' && (
        <motion.span
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-xs text-zinc-400"
        >
          <span>All changes saved</span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
