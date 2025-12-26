/**
 * COHERENCE LOOP VIEW COMPONENT
 * 
 * Shows before/after comparison when a coherence loop verification completes.
 * Displays resolved findings, remaining issues, and improvement metrics.
 */

import { motion } from 'framer-motion';
import {
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowRight,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LoopComparison } from '../../lib/coherence-scan/coherence-loop-service';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CoherenceLoopViewProps {
    comparison: LoopComparison;
    onRunAnotherLoop?: () => void;
    onDismiss?: () => void;
}

export function CoherenceLoopView({
    comparison,
    onRunAnotherLoop,
    onDismiss,
}: CoherenceLoopViewProps) {
    const {
        originalScan,
        verifyScan,
        scoreImprovement,
        resolvedFindings,
        remainingFindings,
        newFindings,
        isCoherent,
    } = comparison;

    const originalScore = originalScan.summary?.healthScore ?? 0;
    const verifyScore = verifyScan.summary?.healthScore ?? 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                    isCoherent ? "bg-emerald-100" : "bg-amber-100"
                )}>
                    {isCoherent ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    ) : (
                        <RefreshCw className="w-8 h-8 text-amber-600" />
                    )}
                </div>
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                    {isCoherent ? 'Coherence Achieved!' : 'Progress Made'}
                </h2>
                <p className="text-[#8A8A8A]">
                    {isCoherent
                        ? 'Your product meets the coherence threshold. Great work!'
                        : 'Your product has improved, but some issues remain.'}
                </p>
            </div>

            {/* Score Comparison */}
            <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-6">Health Score</h3>
                
                <div className="flex items-center justify-center gap-8">
                    {/* Before */}
                    <div className="text-center">
                        <div className="text-3xl font-black text-[#8A8A8A]">
                            {originalScore}
                        </div>
                        <div className="text-xs text-[#8A8A8A] uppercase tracking-wider mt-1">
                            Before
                        </div>
                    </div>

                    {/* Arrow + Delta */}
                    <div className="flex flex-col items-center">
                        <ArrowRight className="w-6 h-6 text-[#8A8A8A]" />
                        <div className={cn(
                            "flex items-center gap-1 text-sm font-bold mt-1",
                            scoreImprovement > 0 && "text-emerald-600",
                            scoreImprovement < 0 && "text-red-600",
                            scoreImprovement === 0 && "text-[#8A8A8A]"
                        )}>
                            {scoreImprovement > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : scoreImprovement < 0 ? (
                                <TrendingDown className="w-4 h-4" />
                            ) : (
                                <Minus className="w-4 h-4" />
                            )}
                            {scoreImprovement > 0 && '+'}
                            {scoreImprovement}
                        </div>
                    </div>

                    {/* After */}
                    <div className="text-center">
                        <div className={cn(
                            "text-3xl font-black",
                            isCoherent ? "text-emerald-600" : "text-[#1A1A1A]"
                        )}>
                            {verifyScore}
                        </div>
                        <div className="text-xs text-[#8A8A8A] uppercase tracking-wider mt-1">
                            After
                        </div>
                    </div>
                </div>

                {/* Threshold indicator */}
                <div className="mt-6 pt-4 border-t border-[#1A1A1A]/5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8A8A8A]">Coherence Threshold</span>
                        <span className={cn(
                            "font-bold",
                            isCoherent ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {isCoherent ? 'Met ✓' : 'Not Yet'}
                        </span>
                    </div>
                    <div className="mt-2 h-2 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${verifyScore}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={cn(
                                "h-full rounded-full",
                                isCoherent ? "bg-emerald-500" : "bg-amber-500"
                            )}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#8A8A8A] mt-1">
                        <span>0</span>
                        <span className="text-emerald-600 font-medium">90 (threshold)</span>
                        <span>100</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {/* Resolved */}
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-emerald-600">
                        {resolvedFindings.length}
                    </div>
                    <div className="text-xs text-emerald-700 font-medium mt-1">
                        Resolved
                    </div>
                </div>

                {/* Remaining */}
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-black text-amber-600">
                        {remainingFindings.length}
                    </div>
                    <div className="text-xs text-amber-700 font-medium mt-1">
                        Remaining
                    </div>
                </div>

                {/* New */}
                <div className={cn(
                    "rounded-xl p-4 text-center",
                    newFindings.length > 0 ? "bg-red-50" : "bg-zinc-50"
                )}>
                    <div className={cn(
                        "text-2xl font-black",
                        newFindings.length > 0 ? "text-red-600" : "text-zinc-400"
                    )}>
                        {newFindings.length}
                    </div>
                    <div className={cn(
                        "text-xs font-medium mt-1",
                        newFindings.length > 0 ? "text-red-700" : "text-zinc-500"
                    )}>
                        New Issues
                    </div>
                </div>
            </div>

            {/* Resolved List */}
            {resolvedFindings.length > 0 && (
                <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Issues Resolved
                    </h3>
                    <ul className="space-y-2">
                        {resolvedFindings.slice(0, 5).map((finding) => (
                            <li
                                key={finding.id}
                                className="flex items-start gap-2 text-sm text-[#5A5A5A]"
                            >
                                <span className="text-emerald-600 mt-0.5">✓</span>
                                <span>{finding.title}</span>
                            </li>
                        ))}
                        {resolvedFindings.length > 5 && (
                            <li className="text-xs text-[#8A8A8A]">
                                +{resolvedFindings.length - 5} more resolved
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Remaining Issues */}
            {remainingFindings.length > 0 && !isCoherent && (
                <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Still Needs Attention
                    </h3>
                    <ul className="space-y-2">
                        {remainingFindings.slice(0, 3).map((finding) => (
                            <li
                                key={finding.id}
                                className="flex items-start gap-2 text-sm text-[#5A5A5A]"
                            >
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span>{finding.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
                {!isCoherent && onRunAnotherLoop && (
                    <button
                        onClick={onRunAnotherLoop}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Run Another Loop
                    </button>
                )}

                {isCoherent && (
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                        <Sparkles className="w-4 h-4" />
                        Ready to Ship!
                    </div>
                )}

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="px-6 py-3 text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
                    >
                        Dismiss
                    </button>
                )}
            </div>
        </div>
    );
}
