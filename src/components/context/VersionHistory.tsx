import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, X } from 'lucide-react';
import type { ProjectContextRevision } from '@/domain/types';
import { Button } from '@/components/ui/Button';

export interface VersionHistoryProps {
  revisions: ProjectContextRevision[];
  currentRevisionId: string | null;
  onRestore: (revisionId: string) => void;
  onClose: () => void;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncateText(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function VersionHistory({
  revisions,
  currentRevisionId,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort revisions by version descending (newest first)
  const sortedRevisions = [...revisions].sort((a, b) => b.version - a.version);

  return (
    <motion.div
      initial={{ x: 350, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 350, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-12 bottom-0 w-[350px] bg-white border-l border-zinc-200 shadow-2xl z-30 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Version History</h3>
        </div>
        <Button
          onClick={onClose}
          className="p-1 hover:bg-zinc-100 rounded transition-colors"
          title="Close"
        >
          <X size={14} className="text-zinc-500" />
        </Button>
      </div>

      {/* Revisions List */}
      <div className="flex-1 overflow-y-auto">
        {sortedRevisions.length === 0 ? (
          <div className="p-6 text-center">
            <Clock size={32} className="text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No revisions yet</p>
          </div>
        ) : (
          <div className="p-2">
            {sortedRevisions.map((revision, index) => {
              const isCurrent = revision.id === currentRevisionId;
              const isHovered = revision.id === hoveredId;

              return (
                <motion.div
                  key={revision.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 mb-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-100 hover:border-zinc-300 bg-white'
                  }`}
                  onMouseEnter={() => setHoveredId(revision.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-zinc-500">
                        v{revision.version}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          revision.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {revision.status === 'approved' ? 'Approved' : 'Draft'}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {formatRelativeTime(revision.createdAt)}
                    </span>
                  </div>

                  {/* Summary Preview */}
                  <p className="text-sm text-zinc-700 mb-2 leading-relaxed">
                    {truncateText(revision.summary)}
                  </p>

                  {/* Actions */}
                  <AnimatePresence>
                    {isHovered && !isCurrent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 pt-2 border-t border-zinc-100"
                      >
                        <Button
                          onClick={() => onRestore(revision.id)}
                          className="w-full px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={12} />
                          Restore this version
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isCurrent && (
                    <div className="mt-2 pt-2 border-t border-zinc-200">
                      <span className="text-xs font-semibold text-zinc-600">
                        Current version
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50">
        <p className="text-xs text-zinc-500">
          Showing last {Math.min(sortedRevisions.length, 20)} revisions
        </p>
      </div>
    </motion.div>
  );
}
