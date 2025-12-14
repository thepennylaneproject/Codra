/**
 * BRIEFING UPDATE BANNER
 * Non-blocking notification for significant project changes
 * "This project has changed since your last visit. Want a quick update?"
 */

import React from 'react';
import { RefreshCw, X, ChevronRight } from 'lucide-react';
import type { ChangeReport } from '../../lib/briefing';

interface BriefingUpdateBannerProps {
    changes: ChangeReport['changes'];
    onShowSummary: () => void;
    onDismiss: () => void;
}

export const BriefingUpdateBanner: React.FC<BriefingUpdateBannerProps> = ({
    changes,
    onShowSummary,
    onDismiss,
}) => {
    // Build change summary text
    const changeSummary = changes.length > 0
        ? changes.map(c => c.description).join(', ')
        : 'Some updates were made';

    return (
        <div className="w-full bg-energy-teal/10 border-b border-energy-teal/20 animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                {/* Icon + Message */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 bg-energy-teal/20 rounded-lg shrink-0">
                        <RefreshCw className="w-4 h-4 text-energy-teal" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-body-sm text-text-primary">
                            <span className="font-medium">This project has changed</span>
                            <span className="text-text-muted hidden sm:inline"> — {changeSummary}</span>
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onShowSummary}
                        className="flex items-center gap-1 px-3 py-1.5 bg-energy-teal text-surface-default rounded-lg text-label-sm font-medium hover:brightness-110 transition-all"
                    >
                        Yes, summarize
                        <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onDismiss}
                        className="px-3 py-1.5 text-text-muted hover:text-text-primary text-label-sm transition-colors"
                    >
                        No thanks
                    </button>
                    <button
                        onClick={onDismiss}
                        className="p-1 text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BriefingUpdateBanner;
