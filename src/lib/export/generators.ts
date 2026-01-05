import type { ProjectContextFormState } from '@/lib/validation/projectBrief';

export type ExportScope = 'output' | 'artifacts' | 'context' | 'custom';
export type ExportFormat = 'json' | 'markdown' | 'html' | 'zip' | 'pdf';
export type ExportDestination = 'download' | 'email' | 'git' | 'drive';

export interface ExportItem {
  id: string;
  title: string;
  type: string;
  content: unknown;
}

export interface ExportPayload {
  scope: ExportScope;
  items: ExportItem[];
  context?: ProjectContextFormState | Record<string, unknown>;
}

export function getFormatsForScope(scope: ExportScope, itemCount: number): ExportFormat[] {
  const base: ExportFormat[] = ['json', 'markdown', 'html', 'pdf'];
  if (scope === 'context' || scope === 'output') {
    return base;
  }
  if (itemCount > 1) {
    return [...base, 'zip'];
  }
  return base;
}

export function estimateSizeBytes(payload: ExportPayload, format: ExportFormat): number {
  const json = JSON.stringify(payload, null, 2);
  const multiplier = format === 'html' ? 1.1 : format === 'markdown' ? 0.9 : 1;
  return Math.round(json.length * multiplier);
}

export function serializeJson(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function serializeMarkdown(payload: ExportPayload): string {
  const lines: string[] = [];
  lines.push(`# Export · ${payload.scope}`);
  if (payload.context) {
    lines.push('', '## Context', '');
    lines.push('```json');
    lines.push(JSON.stringify(payload.context, null, 2));
    lines.push('```');
  }
  if (payload.items.length > 0) {
    lines.push('', '## Artifacts', '');
    payload.items.forEach((item) => {
      lines.push(`### ${item.title}`);
      lines.push('```json');
      lines.push(JSON.stringify(item.content, null, 2));
      lines.push('```', '');
    });
  }
  return lines.join('\n');
}

export function serializeHtml(payload: ExportPayload): string {
  const contextBlock = payload.context
    ? `<section><h2>Context</h2><pre>${escapeHtml(JSON.stringify(payload.context, null, 2))}</pre></section>`
    : '';
  const itemsBlock = payload.items
    .map(
      (item) =>
        `<section><h3>${escapeHtml(item.title)}</h3><pre>${escapeHtml(
          JSON.stringify(item.content, null, 2)
        )}</pre></section>`
    )
    .join('\n');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Codra Export</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 20px; margin-bottom: 16px; }
      h2 { font-size: 16px; margin-top: 24px; }
      h3 { font-size: 14px; margin-top: 16px; }
      pre { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; }
      section + section { margin-top: 16px; }
    </style>
  </head>
  <body>
    <h1>Export · ${escapeHtml(payload.scope)}</h1>
    ${contextBlock}
    ${itemsBlock}
  </body>
</html>`;
}

export async function serializePdf(payload: ExportPayload): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const text = serializeMarkdown(payload);
  const lines = doc.splitTextToSize(text, 520);
  doc.text(lines, 40, 60);
  return doc.output('blob');
}

export function buildPayload(scope: ExportScope, items: ExportItem[], context?: ProjectContextFormState | Record<string, unknown>): ExportPayload {
  return { scope, items, context };
}

export function buildFilename(scope: ExportScope, format: ExportFormat, baseName = 'codra-export'): string {
  return `${baseName}-${scope}.${format === 'markdown' ? 'md' : format}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
