import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, ArrowRight, User } from 'lucide-react';
import { Button } from './ui/Button';
import { ConflictState } from '../hooks/useConflictDetection';

interface ConflictDialogProps {
  conflict: ConflictState | null;
  onUseMine: () => void;
  onUseTheirs: () => void;
}

export function ConflictDialog({
  conflict,
  onUseMine,
  onUseTheirs,
}: ConflictDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conflict) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [conflict]);

  return (
    <AnimatePresence>
      {conflict && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-zinc-100 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-amber-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">Project Updated</h2>
                  <p className="text-zinc-500 mt-1">
                    Another user modified this project while you were editing. Choose which version to keep.
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Changes */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <span className="font-semibold text-blue-900 text-sm">Your Edits</span>
                  </div>
                  <ul className="space-y-2">
                    {conflict.yourChanges.map((change) => (
                      <li key={change} className="flex items-start gap-2 text-sm text-blue-800">
                        <ArrowRight size={14} className="mt-1 flex-shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                    {conflict.yourChanges.length === 0 && (
                      <li className="text-sm text-blue-400 italic">No structural changes detected</li>
                    )}
                  </ul>
                </div>

                {/* Their Changes */}
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User size={14} className="text-emerald-600" />
                    </div>
                    <span className="font-semibold text-emerald-900 text-sm">Teammate&apos;s Edits</span>
                  </div>
                  <ul className="space-y-2">
                    {conflict.theirChanges.map((change) => (
                      <li key={change} className="flex items-start gap-2 text-sm text-emerald-800">
                        <ArrowRight size={14} className="mt-1 flex-shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                    {conflict.theirChanges.length === 0 && (
                      <li className="text-sm text-emerald-400 italic">Version incremented without visible changes</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Overlap Warning */}
              {conflict.overlap.length > 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <h4 className="text-red-900 font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Direct Conflicts Detected
                  </h4>
                  <p className="text-sm text-red-800 mb-3">
                    Both you and your teammate edited the same sections. Overwriting is required.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {conflict.overlap.map(section => (
                      <span key={section} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="text-emerald-600" size={18} />
                  </div>
                  <p className="text-sm text-emerald-800">
                    Changes do not overlap. You can safely merge both sets of edits.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={onUseMine}
                  className="flex-1 h-12 font-semibold"
                >
                  Keep My Version
                </Button>
                <Button
                  variant="ghost"
                  onClick={onUseTheirs}
                  className="flex-1 h-12 text-zinc-600 hover:text-zinc-900"
                >
                  Accept Theirs
                </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
