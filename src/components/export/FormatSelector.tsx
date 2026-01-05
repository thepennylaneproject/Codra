import { Button } from '@/components/ui/Button';
import type { ExportFormat } from '@/lib/export/generators';

interface FormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  formats: ExportFormat[];
}

const LABELS: Record<ExportFormat, string> = {
  json: 'JSON',
  markdown: 'Markdown',
  html: 'HTML',
  zip: 'ZIP',
  pdf: 'PDF',
};

export function FormatSelector({ value, onChange, formats }: FormatSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {formats.map((format) => (
        <Button
          key={format}
          onClick={() => onChange(format)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === format ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
          }`}
        >
          {LABELS[format]}
        </Button>
      ))}
    </div>
  );
}
