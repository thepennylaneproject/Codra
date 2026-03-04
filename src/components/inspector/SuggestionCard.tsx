import { DeskSuggestion } from '@/lib/desk-suggestions';
import { PROJECT_TOOLS } from '@/domain/types';

interface SuggestionCardProps {
  suggestion: DeskSuggestion;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEditTitle: (title: string) => void;
}

export function SuggestionCard({ suggestion, isSelected, onSelect, onEditTitle }: SuggestionCardProps) {
  const desk = PROJECT_TOOLS.find(d => d.id === suggestion.deskId);

  return (
    <div className={`p-4 rounded-xl border transition-all ${isSelected ? 'border-zinc-900 bg-zinc-50 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
      <div className="flex gap-3">
        <div className="pt-0.5">
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              {desk?.label || suggestion.deskId}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {(suggestion.relevance * 100).toFixed(0)}% relevant
            </span>
          </div>
          <input 
            className="w-full text-sm font-semibold bg-transparent border-none focus:ring-0 p-0 text-zinc-900"
            value={suggestion.title}
            onChange={(e) => onEditTitle(e.target.value)}
          />
          <p className="text-xs text-zinc-500 leading-relaxed">
            {suggestion.description}
          </p>
        </div>
      </div>
    </div>
  );
}
