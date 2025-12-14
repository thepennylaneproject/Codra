/**
 * BRIEFING SNAPSHOT
 * Project Orientation overlay panel for mid-project entry
 * Shows: what this project is, current phase, what exists, last activity
 * 
 * "Here's the state of things. Here's what's done. Here's where you can help."
 */

import React from 'react';
import { X, ArrowRight, Play, Compass } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import {
    getPhaseLabel,
    getPhaseEmoji,
    formatStatsLine,
    formatRelativeTime,
    type ProjectPhase,
    type ProjectStats,
} from '../../lib/briefing';
import type { ProjectSpec } from '../../types/architect';

interface BriefingSnapshotProps {
    project: ProjectSpec;
    phase: ProjectPhase;
    stats: ProjectStats;
    lastActivityAt?: string;
    lastActivityBy?: string;
    onShowMeAround: () => void;
    onJumpToNextTask: () => void;
    onDismiss: () => void;
}

export const BriefingSnapshot: React.FC<BriefingSnapshotProps> = ({
    project,
    phase,
    stats,
    lastActivityAt,
    lastActivityBy,
    onShowMeAround,
    onJumpToNextTask,
    onDismiss,
}) => {
    const hasContent = stats.taskCount > 0 || stats.flowCount > 0 || stats.promptCount > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Snapshot Panel */}
            <GlassPanel
                variant="floating"
                glow="teal"
                className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"
            >
                <div className="p-6">
                    {/* Close Button */}
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-energy-teal/20 rounded-xl">
                            <Compass className="w-5 h-5 text-energy-teal" />
                        </div>
                        <div>
                            <h2 className="text-heading-md text-text-primary font-semibold">
                                Project Overview
                            </h2>
                            <p className="text-body-sm text-text-muted">
                                Here's what you need to know
                            </p>
                        </div>
                    </div>

                    {/* Project Summary */}
                    <div className="mb-6">
                        <h3 className="text-label-md text-text-primary font-medium mb-1">
                            {project.title}
                        </h3>
                        <p className="text-body-sm text-text-secondary leading-relaxed">
                            {project.summary}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Current Phase */}
                        <div className="p-3 bg-white/5 rounded-xl">
                            <p className="text-label-xs text-text-muted uppercase tracking-wider mb-1">
                                Current Phase
                            </p>
                            <p className="text-body-md text-text-primary font-medium flex items-center gap-2">
                                <span>{getPhaseEmoji(phase)}</span>
                                <span>{getPhaseLabel(phase)}</span>
                            </p>
                        </div>

                        {/* Last Activity */}
                        <div className="p-3 bg-white/5 rounded-xl">
                            <p className="text-label-xs text-text-muted uppercase tracking-wider mb-1">
                                Last Activity
                            </p>
                            <p className="text-body-md text-text-primary font-medium">
                                {lastActivityAt
                                    ? formatRelativeTime(lastActivityAt)
                                    : 'No activity yet'
                                }
                            </p>
                            {lastActivityBy && (
                                <p className="text-label-xs text-text-muted mt-0.5">
                                    by {lastActivityBy}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* What Exists */}
                    <div className="p-3 bg-white/5 rounded-xl mb-6">
                        <p className="text-label-xs text-text-muted uppercase tracking-wider mb-1">
                            What Exists
                        </p>
                        <p className="text-body-sm text-text-primary">
                            {formatStatsLine(stats)}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onShowMeAround}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-energy-teal/20 text-energy-teal rounded-lg font-medium hover:bg-energy-teal/30 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Show me around
                        </button>

                        {hasContent && (
                            <button
                                onClick={onJumpToNextTask}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-energy-magenta/20 text-energy-magenta rounded-lg font-medium hover:bg-energy-magenta/30 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Jump to next task
                            </button>
                        )}

                        <button
                            onClick={onDismiss}
                            className="px-4 py-2.5 text-text-muted hover:text-text-primary transition-colors text-body-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

export default BriefingSnapshot;
