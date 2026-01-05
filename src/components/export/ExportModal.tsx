import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Mail, Github, Cloud, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ScopeSelector } from './ScopeSelector';
import { FormatSelector } from './FormatSelector';
import {
  buildFilename,
  buildPayload,
  downloadBlob,
  estimateSizeBytes,
  getFormatsForScope,
  serializeHtml,
  serializeJson,
  serializeMarkdown,
  serializePdf,
  type ExportDestination,
  type ExportFormat,
  type ExportItem,
  type ExportScope,
} from '@/lib/export/generators';
import { analytics } from '@/lib/analytics';
import { useToast } from '@/new/components/Toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultScope?: ExportScope;
  currentOutput?: ExportItem | null;
  items?: ExportItem[];
  contextData?: Record<string, unknown>;
  projectName?: string;
}

const DESTINATIONS: { value: ExportDestination; label: string; icon: ElementType }[] = [
  { value: 'download', label: 'Download', icon: Download },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'git', label: 'Git', icon: Github },
  { value: 'drive', label: 'Drive', icon: Cloud },
];

export function ExportModal({
  isOpen,
  onClose,
  defaultScope = 'output',
  currentOutput,
  items = [],
  contextData,
  projectName = 'codra-project',
}: ExportModalProps) {
  const toast = useToast();
  const [scope, setScope] = useState<ExportScope>(defaultScope);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [destination, setDestination] = useState<ExportDestination>('download');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setScope(defaultScope);
  }, [defaultScope, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem('codra:export:format') as ExportFormat | null;
    if (saved) setFormat(saved);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (scope === 'custom') {
      setSelectedIds(items.map((item) => item.id));
    }
  }, [scope, items, isOpen]);

  const activeItems = useMemo(() => {
    if (scope === 'output') return currentOutput ? [currentOutput] : [];
    if (scope === 'context') return [];
    if (scope === 'custom') return items.filter((item) => selectedIds.includes(item.id));
    return items;
  }, [scope, items, selectedIds, currentOutput]);

  const availableFormats = useMemo(
    () => getFormatsForScope(scope, activeItems.length),
    [scope, activeItems.length]
  );

  useEffect(() => {
    if (!availableFormats.includes(format)) {
      setFormat(availableFormats[0]);
    }
  }, [availableFormats, format]);

  const payload = useMemo(
    () => buildPayload(scope, activeItems, scope === 'context' ? contextData : undefined),
    [scope, activeItems, contextData]
  );

  const estimatedSize = estimateSizeBytes(payload, format);
  const itemCount = scope === 'context' ? (contextData ? 1 : 0) : activeItems.length;

  const handleExport = async () => {
    if (destination !== 'download') {
      toast.warning(`Destination "${destination}" is not configured yet.`);
      return;
    }
    if (scope === 'output' && !currentOutput) {
      toast.warning('No active output selected.');
      return;
    }
    if (scope === 'context' && !contextData) {
      toast.warning('No context data available.');
      return;
    }

    setIsExporting(true);
    const fileBase = projectName.toLowerCase().replace(/\s+/g, '-');
    const filename = buildFilename(scope, format, fileBase);

    try {
      if (format === 'pdf') {
        const blob = await serializePdf(payload);
        downloadBlob(blob, filename);
      } else if (format === 'zip') {
        const content = serializeJson(payload);
        const blob = new Blob([content], { type: 'application/zip' });
        downloadBlob(blob, filename);
      } else {
        const content =
          format === 'markdown'
            ? serializeMarkdown(payload)
            : format === 'html'
              ? serializeHtml(payload)
              : serializeJson(payload);
        const mime =
          format === 'markdown' ? 'text/markdown' : format === 'html' ? 'text/html' : 'application/json';
        const blob = new Blob([content], { type: mime });
        downloadBlob(blob, filename);
      }

      localStorage.setItem('codra:export:format', format);
      localStorage.setItem('codra-export-completed', 'true'); // Track for onboarding checklist
      analytics.track('export_completed', {
        scope,
        format,
        destination,
        item_count: itemCount,
      });
      toast.success(`Exported ${itemCount} item${itemCount === 1 ? '' : 's'}.`);
      onClose();
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="w-full max-w-3xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Export</h2>
              <p className="text-xs text-text-soft mt-1">Choose scope, format, and destination.</p>
            </div>
            <Button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X size={16} className="text-zinc-500" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <SectionHeader title="Scope" meta="Select what you want to export." className="mt-0" />
              <ScopeSelector value={scope} onChange={setScope} />
            </section>

            {scope === 'custom' && (
              <section>
                <SectionHeader title="Custom selection" meta="Choose which artifacts to include." className="mt-0" />
                <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 px-4 py-2 text-xs text-text-soft">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) =>
                            e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                          );
                        }}
                      />
                      <span className="text-text-primary font-semibold">{item.title}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionHeader title="Format" meta="Available formats based on your scope." className="mt-0" />
              <FormatSelector value={format} onChange={setFormat} formats={availableFormats} />
            </section>

            <section>
              <SectionHeader title="Destination" meta="Where should the export go?" className="mt-0" />
              <div className="flex flex-wrap gap-2">
                {DESTINATIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      onClick={() => setDestination(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                        destination === option.value ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Icon size={12} />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionHeader title="Preview" meta="Estimated output size." className="mt-0" />
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-xs text-text-soft">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-text-primary">{itemCount}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Estimated size</span>
                  <span className="font-semibold text-text-primary">
                    {(estimatedSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-white">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting || itemCount === 0}>
              {isExporting ? 'Exporting…' : `Export ${itemCount} item${itemCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
