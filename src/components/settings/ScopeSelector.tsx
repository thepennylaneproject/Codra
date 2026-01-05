import { Button } from '@/components/ui/Button';

export type SettingsScope = 'task' | 'project' | 'global';

interface ScopeSelectorProps {
  value: SettingsScope;
  onChange: (scope: SettingsScope) => void;
}

const OPTIONS: { value: SettingsScope; label: string; description: string }[] = [
  { value: 'task', label: 'This Task', description: 'Only affects the current task' },
  { value: 'project', label: 'This Project', description: 'Applies to all tasks in this project' },
  { value: 'global', label: 'All Projects', description: 'Default for new projects' },
];

export function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            value === option.value
              ? 'bg-white text-text-primary shadow-sm'
              : 'text-text-soft hover:text-text-primary'
          }`}
          title={option.description}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
