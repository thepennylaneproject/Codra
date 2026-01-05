import { Button } from '@/components/ui/Button';
import type { ExportScope } from '@/lib/export/generators';

interface ScopeSelectorProps {
  value: ExportScope;
  onChange: (scope: ExportScope) => void;
}

const OPTIONS: { value: ExportScope; label: string; description: string }[] = [
  { value: 'output', label: 'This Output', description: 'Only the current artifact.' },
  { value: 'artifacts', label: 'All Artifacts', description: 'Every artifact in the project.' },
  { value: 'context', label: 'Context', description: 'Project context and constraints.' },
  { value: 'custom', label: 'Custom', description: 'Choose specific items.' },
];

export function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === option.value ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
          }`}
          title={option.description}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
