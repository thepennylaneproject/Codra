/**
 * RETRIEVAL SOURCES PANEL
 * src/new/components/workspace/RetrievalSourcesPanel.tsx
 *
 * Inline source search and citation list for proofing.
 */

import { useState } from 'react';
import { retrievalSearch, type RetrievalResultItem } from '@/lib/retrieval/client';

interface RetrievalSourcesPanelProps {
  projectId?: string;
}

export function RetrievalSourcesPanel({ projectId }: RetrievalSourcesPanelProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'error' | 'success'>('idle');
  const [results, setResults] = useState<RetrievalResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setStatus('running');
    setError(null);

    const response = await retrievalSearch({
      query: query.trim(),
      maxResults: 5,
      workspaceId: projectId,
    });

    if (!response.success) {
      setStatus('error');
      setError(response.error || 'Search failed');
      setResults([]);
      return;
    }

    setResults(response.results);
    setStatus('success');
  };

  return (
    <div className="border-t border-[var(--ui-border)]/15">
      <div className="h-8 px-4 flex items-center border-b border-[var(--ui-border)]/15">
        <span className="text-xs text-text-soft/40 uppercase tracking-widest">
          Sources
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sources"
            className="flex-1 text-xs bg-transparent border-b border-[var(--ui-border)]/30 focus:outline-none focus:border-[var(--color-gold)]/60 pb-1"
          />
          <button
            onClick={handleSearch}
            disabled={status === 'running' || !query.trim()}
            className="text-[10px] uppercase tracking-widest underline underline-offset-4 text-text-soft/70 hover:text-text-primary disabled:opacity-40"
          >
            Search
          </button>
        </div>

        {status === 'running' && (
          <div className="text-[10px] uppercase tracking-widest text-text-soft/60">
            Searching...
          </div>
        )}

        {status === 'error' && (
          <div className="text-xs text-text-soft/60">
            {error}
          </div>
        )}

        {status === 'success' && results.length === 0 && (
          <div className="text-xs text-text-soft/50">
            No sources found.
          </div>
        )}

        {results.length > 0 && (
          <ol className="space-y-2">
            {results.map((item, index) => (
              <li key={item.url} className="border-b border-[var(--ui-border)]/10 pb-2">
                <div className="text-[10px] uppercase tracking-widest text-text-soft/60">
                  Source {index + 1}
                </div>
                <div className="text-xs text-text-primary truncate">{item.title}</div>
                <div className="text-[10px] text-text-soft/60 truncate">{item.url}</div>
                {item.snippet && (
                  <div className="text-xs text-text-soft/60 mt-1">
                    {item.snippet}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
