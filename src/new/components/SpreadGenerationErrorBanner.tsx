/**
 * SPREAD GENERATION ERROR BANNER
 * src/new/components/SpreadGenerationErrorBanner.tsx
 * 
 * Prominent error banner shown when spread generation fails.
 * Provides retry functionality and optional technical details.
 */

import { useState } from 'react';
import { AlertTriangle, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface SpreadGenerationErrorBannerProps {
  errorMessage: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function SpreadGenerationErrorBanner({
  errorMessage,
  onRetry,
  isRetrying = false,
}: SpreadGenerationErrorBannerProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-6 mb-6"
    >
      <div className="bg-red-600 text-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Main Banner */}
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-xl">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Failed to generate project brief
              </h3>
              <p className="text-red-100 text-sm mt-0.5">
                Please try again. If the problem persists, contact support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-100 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
            >
              View Details
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 font-semibold text-sm rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={16} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-red-500"
            >
              <div className="px-6 py-4 bg-red-700">
                <p className="text-xs text-red-200 font-mono uppercase tracking-wide mb-2">
                  Technical Details
                </p>
                <code className="text-sm text-red-100 font-mono break-all">
                  {errorMessage}
                </code>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
