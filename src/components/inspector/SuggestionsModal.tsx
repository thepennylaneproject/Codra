import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductionDeskId } from '@/domain/types';
import { DeskSuggestion, getDeskSuggestions } from '@/lib/desk-suggestions';
import { SuggestionCard } from './SuggestionCard';
import { analytics } from '@/lib/analytics';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDesk: ProductionDeskId;
  artifactType: string;
  artifactContent: string;
  onBatchCreate: (suggestions: DeskSuggestion[]) => Promise<void>;
}

export function SuggestionsModal({
  isOpen,
  onClose,
  sourceDesk,
  artifactType,
  artifactContent,
  onBatchCreate
}: SuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<DeskSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const results = getDeskSuggestions(sourceDesk, artifactType, artifactContent);
      setSuggestions(results);
      // Auto-select top suggestion
      if (results.length > 0) {
        setSelectedIds(new Set([0]));
      }
    }
  }, [isOpen, sourceDesk, artifactType, artifactContent]);

  const handleToggleSelect = (index: number) => {
    const next = new Set(selectedIds);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIds(next);
  };

  const handleEditTitle = (index: number, newTitle: string) => {
    const next = [...suggestions];
    next[index] = { ...next[index], title: newTitle };
    setSuggestions(next);
  };

  const handleCreateAll = async () => {
    setIsCreating(true);
    const selected = suggestions.filter((_, i) => selectedIds.has(i));
    try {
      await onBatchCreate(selected);
      analytics.track('batch_suggestions_created', {
        count: selected.length,
        desks: selected.map(s => s.deskId)
      });
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <header className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Coordination Suggestions</h3>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Follow-up actions for other desks</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-start">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <Layers size={16} />
                </div>
                <div className="text-xs text-emerald-800 leading-relaxed">
                  <span className="font-bold">Work Approved!</span> Since you've approved the {artifactType}, 
                  we've identified these logical next steps for your production team.
                </div>
              </div>

              <div className="grid gap-3">
                {suggestions.map((suggestion, i) => (
                  <SuggestionCard
                    key={i}
                    suggestion={suggestion}
                    isSelected={selectedIds.has(i)}
                    onSelect={() => handleToggleSelect(i)}
                    onEditTitle={(title) => handleEditTitle(i, title)}
                  />
                ))}
              </div>

              {suggestions.length === 0 && (
                <div className="text-center py-12 text-zinc-400 space-y-2">
                  <Plus size={32} className="mx-auto opacity-20" />
                  <p className="text-sm">No specific suggestions found for this artifact.</p>
                </div>
              )}
            </div>

            <footer className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-4">
              <div className="text-xs text-zinc-500">
                {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} will be added to queue
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 min-w-[140px]"
                  disabled={selectedIds.size === 0 || isCreating}
                  onClick={handleCreateAll}
                >
                  {isCreating ? 'Creating...' : `Create Tasks (+${selectedIds.size})`}
                </Button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
