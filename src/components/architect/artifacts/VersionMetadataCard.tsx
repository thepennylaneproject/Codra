/**
 * VERSION METADATA CARD
 * Displays context about a specific version:
 * - Who created it (User vs Agent)
 * - What model was used
 * - Feedback tags/notes attached to it
 * - Timestamps
 */

import React from 'react';
import { User, Bot, Tag, MessageSquare, Clock } from 'lucide-react';
import type { ArtifactVersion } from '../../../types/architect';

interface VersionMetadataCardProps {
    version: ArtifactVersion;
}

export const VersionMetadataCard: React.FC<VersionMetadataCardProps> = ({ version }) => {
    const isAgent = version.createdBy === 'agent';

    return (
        <div className="bg-background-subtle border-b border-border-subtle p-4 space-y-3">
            {/* Top Row: Creator & Model */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isAgent ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-blue/10 text-brand-blue'}`}>
                        {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="text-label-sm font-semibold text-text-primary">
                            {isAgent ? 'AI Assistant' : 'User'}
                        </div>
                        {isAgent && version.modelUsed && (
                            <div className="text-body-xs text-text-muted flex items-center gap-1">
                                <span>via</span>
                                <span className="font-medium text-text-secondary">{version.modelUsed}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center text-text-muted text-body-xs gap-1.5" title={new Date(version.createdAt).toLocaleString()}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo(version.createdAt)}</span>
                </div>
            </div>

            {/* Prompt Used (if available) */}
            {isAgent && version.promptUsed && (
                <div className="text-body-xs text-text-secondary bg-background-default p-2 rounded border border-border-subtle truncate">
                    <span className="font-semibold text-text-muted mr-1">Prompt:</span>
                    {version.promptUsed}
                </div>
            )}

            {/* Feedback Section */}
            {(version.userFeedbackTags?.length || version.userFeedbackNote) && (
                <div className="pt-2 border-t border-border-subtle/50 space-y-2">
                    {/* Tags */}
                    {version.userFeedbackTags && version.userFeedbackTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {version.userFeedbackTags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-background-elevated text-text-secondary border border-border-subtle">
                                    <Tag className="w-3 h-3 opacity-50" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Note */}
                    {version.userFeedbackNote && (
                        <div className="flex gap-2 text-body-xs text-text-secondary">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-text-muted shrink-0" />
                            <p className="italic">"{version.userFeedbackNote}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Simple relative time helper
function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}
