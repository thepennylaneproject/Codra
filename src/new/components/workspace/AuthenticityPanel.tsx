/**
 * AUTHENTICITY PANEL
 * src/new/components/workspace/AuthenticityPanel.tsx
 *
 * Proofing section for authenticity checks.
 */

import { useState } from 'react';
import { analyzeAuthenticity } from '@/lib/copy/authenticity-detector';
import type { AuthenticityResult } from '@/lib/copy/authenticity-detector';

interface AuthenticityPanelProps {
  output?: string;
  title?: string;
}

export function AuthenticityPanel({ output, title }: AuthenticityPanelProps) {
  const [result, setResult] = useState<AuthenticityResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    if (!output) return;
    setIsRunning(true);
    const next = analyzeAuthenticity(output);
    setResult(next);
    setIsRunning(false);
  };

  return (
    <div className="border-t border-[var(--ui-border)]/15">
      <div className="h-8 px-4 flex items-center justify-between border-b border-[var(--ui-border)]/15">
        <span className="text-xs text-text-soft/40 uppercase tracking-widest">
          Authenticity
        </span>
        <button
          onClick={handleRun}
          disabled={!output || isRunning}
          className="text-[10px] uppercase tracking-widest underline underline-offset-4 text-text-soft/60 hover:text-text-primary disabled:opacity-40"
        >
          {isRunning ? 'Running' : 'Run check'}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {!output && (
          <p className="text-xs text-text-soft/50">
            No output available to analyze.
          </p>
        )}

        {output && !result && (
          <p className="text-xs text-text-soft/60">
            Select “Run check” to identify clichés and generic phrasing.
          </p>
        )}

        {result && (
          <div className="space-y-3">
            <div className="border border-[var(--ui-border)]/20 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-text-soft/60">
                Result
              </div>
              <div className="text-sm text-text-primary">
                {result.grade} · {result.score}%
              </div>
              <div className="text-xs text-text-soft/60">
                {result.summary}
              </div>
              {title && (
                <div className="text-[10px] uppercase tracking-widest text-text-soft/40 mt-1">
                  {title}
                </div>
              )}
            </div>

            {result.issues.length === 0 ? (
              <p className="text-xs text-text-soft/60">
                No authenticity issues detected.
              </p>
            ) : (
              <ol className="space-y-2">
                {result.issues.map((issue, index) => (
                  <li key={issue.id} className="border border-[var(--ui-border)]/15 rounded-md px-3 py-2">
                    <div className="text-[10px] uppercase tracking-widest text-text-soft/60">
                      Issue {index + 1} · {issue.severity}
                    </div>
                    <div className="text-xs text-text-primary mt-1">
                      “{issue.original}”
                    </div>
                    <div className="text-xs text-text-soft/60 mt-1">
                      {issue.reason}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
