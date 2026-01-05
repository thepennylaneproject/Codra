import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChecklistItem } from './ChecklistItem';
import { useChecklist } from '@/hooks/useChecklist';
import { motion, AnimatePresence } from 'framer-motion';

interface ChecklistPanelProps {
  projectId?: string;
  className?: string;
}

export function ChecklistPanel({ projectId, className = '' }: ChecklistPanelProps) {
  const { items, completedCount, allComplete, dismissed, dismiss } = useChecklist(projectId);
  const [expanded, setExpanded] = useState(true);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="relative">
        <Button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-text-primary">Configuration checklist</h3>
              <p className="text-xs text-text-soft">
                {allComplete ? 'All items complete' : `${completedCount} of ${items.length} complete`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress Badge */}
            <div
              className={`
                px-3 py-1 rounded-full text-xs font-semibold transition-colors
                ${allComplete
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-600'
                }
              `}
            >
              {completedCount}/{items.length}
            </div>

            {/* Expand/Collapse Icon */}
            {expanded ? (
              <ChevronUp size={16} className="text-text-soft" />
            ) : (
              <ChevronDown size={16} className="text-text-soft" />
            )}
          </div>
        </Button>

        {/* Dismiss Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="absolute top-4 right-4 p-1 hover:bg-zinc-200 rounded-lg transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
          title="Close configuration status"
        >
          <X size={14} className="text-text-soft" />
        </Button>
      </div>

      {/* Checklist Items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              <ul className="space-y-3">
                {items.map((item) => (
                  <ChecklistItem key={item.id} {...item} />
                ))}
              </ul>

              {/* Completion Celebration */}
              {allComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-900 mb-1">
                        Checklist complete
                      </h4>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Base configuration complete. Advanced modules available: Templates and Coherence Scan.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
