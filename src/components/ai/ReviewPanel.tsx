import React from 'react';
import { AlertTriangle, XCircle, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { CodeReview, CodeReviewIssue } from '../../lib/ai/code';

interface ReviewPanelProps {
    review: CodeReview | null;
    onApplyFix: (fix: string, issue: CodeReviewIssue) => void;
    onClose: () => void;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({ review, onApplyFix, onClose }) => {
    if (!review) return null;

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'suggestion': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Info className="w-4 h-4 text-zinc-500" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-800 w-96 fixed right-0 top-0 shadow-xl z-50">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-500" />
                    Code Review
                </h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-white">
                    <XCircle className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400">Quality Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(review.score)}`}>{review.score}/100</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${review.score >= 90 ? 'bg-green-500' : review.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${review.score}%` }}
                    />
                </div>
                <p className="mt-4 text-sm text-zinc-300 italic">"{review.summary}"</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {review.issues.map((issue, idx) => (
                    <div key={idx} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <div className="flex items-start gap-2 mb-2">
                            <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                            <div>
                                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{issue.severity} • Line {issue.line}</span>
                                <p className="text-sm text-zinc-200 mt-1">{issue.message}</p>
                            </div>
                        </div>

                        {issue.fix && (
                            <div className="mt-3 pl-6">
                                <button
                                    onClick={() => onApplyFix(issue.fix!, issue)}
                                    className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-1 rounded"
                                >
                                    Apply Fix <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {review.issues.length === 0 && (
                    <div className="text-center text-zinc-500 mt-10">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500/20" />
                        <p>No issues found. Great job!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
