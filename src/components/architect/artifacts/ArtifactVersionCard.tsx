/**
 * ARTIFACT VERSION CARD
 * Displays a single version in the history timeline
 */

import React from 'react';
import { Eye, RotateCcw, Bot, User, MessageSquare } from 'lucide-react';
import type { ArtifactVersion } from '../../../types/architect';

interface ArtifactVersionCardProps {
    version: ArtifactVersion;
    isLatest: boolean;
    isCurrent: boolean;
    isSelected: boolean;
    compareMode: boolean;
    onClick: () => void;
    onRestore: () => void;
    onView: () => void;
}

export const ArtifactVersionCard: React.FC<ArtifactVersionCardProps> = ({
    version,
    isLatest,
    isCurrent,
    isSelected,
    compareMode,
    onClick,
    onRestore,
    onView,
}) => {
    const hasFeedback = (version.userFeedbackTags && version.userFeedbackTags.length > 0) || !!version.userFeedbackNote;

    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                    ? 'bg-brand-teal/10 border-brand-teal ring-1 ring-brand-teal/30'
                    : isCurrent
                        ? 'bg-brand-magenta/10 border-brand-magenta/30'
                        : 'bg-background-subtle border-border-subtle hover:border-border-strong'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${isCurrent
                            ? 'bg-brand-magenta text-white'
                            : 'bg-background-default text-text-muted'
                        }`}>
                        v{version.versionNumber}
                    </span>
                    {isLatest && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-teal/20 text-brand-teal text-xs">
                            Latest
                        </span>
                    )}
                </div>
                <span className="text-xs text-text-soft">
                    {formatTimeAgo(version.createdAt)}
                </span>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-1.5 mb-2 text-xs text-text-muted">
                {version.createdBy === 'agent' ? (
                    <>
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Generated</span>
                    </>
                ) : (
                    <>
                        <User className="w-3.5 h-3.5" />
                        <span>Manual Edit</span>
                    </>
                )}
                {version.modelUsed && (
                    <span className="ml-1 text-text-soft">• {version.modelUsed}</span>
                )}
            </div>

            {/* Feedback Tags */}
            {hasFeedback && (
                <div className="mb-2">
                    {version.userFeedbackTags && version.userFeedbackTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {version.userFeedbackTags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-1.5 py-0.5 bg-brand-gold/10 text-brand-gold text-xs rounded"
                                >
                                    {tag.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    )}
                    {version.userFeedbackNote && (
                        <div className="flex items-start gap-1.5 text-xs text-text-secondary">
                            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="italic line-clamp-2">{version.userFeedbackNote}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            {!compareMode && !isCurrent && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-text-primary hover:bg-background-default transition-colors"
                    >
                        <Eye className="w-3 h-3" />
                        View
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRestore(); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-brand-teal hover:bg-brand-teal/10 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                    </button>
                </div>
            )}
        </div>
    );
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
