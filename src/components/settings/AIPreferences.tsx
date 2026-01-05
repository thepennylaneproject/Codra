import { ModelSelector } from '@/new/components/ModelSelector';
import { Button } from '@/components/ui/Button';
import type { QualityCostLatencyPriority } from '@/domain/types';

export interface AIPreferencesValue {
  modelId: string;
  providerId: string;
  qualityPriority: QualityCostLatencyPriority | null;
  smartMode: boolean;
}

interface AIPreferencesProps {
  value: AIPreferencesValue;
  onChange: (updates: Partial<AIPreferencesValue>) => void;
}

const QUALITY_OPTIONS: { value: QualityCostLatencyPriority; label: string }[] = [
  { value: 'quality', label: 'Quality' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'fast', label: 'Fast' },
  { value: 'cheap', label: 'Cost' },
];

export function AIPreferences({ value, onChange }: AIPreferencesProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-text-soft">Primary model</label>
        <div className="mt-2">
          <ModelSelector
            selectedModelId={value.modelId}
            onSelectModel={(modelId, providerId) => onChange({ modelId, providerId })}
            isSmartMode={value.smartMode}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-text-soft">Quality profile</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUALITY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onChange({ qualityPriority: option.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                value.qualityPriority === option.value
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
        <div>
          <p className="text-xs font-semibold text-text-primary">Smart routing</p>
          <p className="text-xs text-text-soft">Allow auto-selection between models.</p>
        </div>
        <Button
          onClick={() => onChange({ smartMode: !value.smartMode })}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value.smartMode ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {value.smartMode ? 'On' : 'Off'}
        </Button>
      </div>
    </div>
  );
}
