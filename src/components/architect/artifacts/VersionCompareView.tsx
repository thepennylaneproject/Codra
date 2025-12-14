/**
 * VERSION COMPARE VIEW
 * Side-by-side comparison of two artifact versions
 * Shows diff highlighting and metadata context
 */

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { ArtifactVersion, Artifact } from '../../../types/architect';
import { DiffRenderer } from './DiffRenderer';
import { VersionMetadataCard } from './VersionMetadataCard';
import type { VersionComparison } from '../../../lib/artifacts/version-manager';

interface VersionCompareViewProps {
    artifact: Artifact;
    comparison: VersionComparison;
    allVersions: ArtifactVersion[];
    onClose: () => void;
    onSelectVersion: (versionId: string) => void;
    onApproveVersion: (versionId: string) => void;
}

type ViewMode = 'side-by-side' | 'unified' | 'inline';

export const VersionCompareView: React.FC<VersionCompareViewProps> = ({
    artifact,
    comparison,
    allVersions,
    onClose,
    onSelectVersion,
    onApproveVersion,
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
    const [showMetadata, setShowMetadata] = useState(true);

    const { versionA, versionB, diff, summary } = comparison;

    // Find positions in version list for navigation
    // Note: allVersions is usually ordered DESC (newest first). 
    // comparison.versionA is typically the Older one (Previous).
    // comparison.versionB is typically the Newer one (Current).

    const versionAIndex = allVersions.findIndex(v => v.id === versionA.id);
    const versionBIndex = allVersions.findIndex(v => v.id === versionB.id);

    // Navigation Logic
    // Assuming allVersions is sorted DESC (newest at index 0)

    // Navigate A (Older side):
    // Prev (Older): index + 1
    // Next (Newer): index - 1 (but must stay older than B)
    const canNavigateA = {
        prev: versionAIndex < allVersions.length - 1, // Has older versions
        next: versionAIndex > 0 && (versionAIndex - 1) !== versionBIndex // Has newer versions, but don't cross B
    };

    // Navigate B (Newer side):
    // Prev (Older): index + 1 (but must stay newer than A)
    // Next (Newer): index - 1
    const canNavigateB = {
        prev: versionBIndex < allVersions.length - 1 && (versionBIndex + 1) !== versionAIndex, // Can go older, but don't cross A
        next: versionBIndex > 0 // Has newer versions
    };

    const navigateVersion = (side: 'A' | 'B', direction: 'prev' | 'next') => {
        const currentIndex = side === 'A' ? versionAIndex : versionBIndex;
        // In DESC array: 'prev' (older) means HIGHER index, 'next' (newer) means LOWER index
        const newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;

        const newVersion = allVersions[newIndex];
        if (newVersion) {
            // This would trigger a new comparison via parent
            onSelectVersion(newVersion.id);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background-default animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-background-elevated shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-background-subtle rounded-lg transition-colors text-text-muted hover:text-text-primary"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-label-lg text-text-primary font-semibold flex items-center gap-2">
                            Compare Versions
                            <span className="px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-normal border border-brand-blue/20">
                                {artifact.type}
                            </span>
                        </h2>
                        <p className="text-body-sm text-text-muted">
                            {artifact.name} — <span className="font-mono">v{versionA.versionNumber}</span> vs <span className="font-mono">v{versionB.versionNumber}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-background-subtle rounded-lg p-1 border border-border-subtle">
                        {(['side-by-side', 'unified'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 rounded-md text-label-sm transition-colors ${viewMode === mode
                                        ? 'bg-background-elevated text-text-primary shadow-sm font-medium'
                                        : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {mode === 'side-by-side' ? 'Split View' : 'Unified View'}
                            </button>
                        ))}
                    </div>

                    {/* Toggle Metadata */}
                    <button
                        onClick={() => setShowMetadata(!showMetadata)}
                        className={`px-3 py-1.5 rounded-lg text-label-sm transition-colors border ${showMetadata
                                ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/20'
                                : 'text-text-muted hover:text-text-primary border-transparent hover:bg-background-subtle'
                            }`}
                    >
                        {showMetadata ? 'Hide' : 'Show'} Details
                    </button>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="flex items-center justify-center gap-8 px-6 py-2 border-b border-border-subtle bg-background-subtle/50 backdrop-blur-sm z-10 h-10">
                <div className="flex items-center gap-2" title={`${summary.additions} lines added`}>
                    <span className="w-2 h-2 rounded-full bg-state-success" />
                    <span className="text-label-sm font-medium text-text-secondary">
                        {summary.additions} addition{summary.additions !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2" title={`${summary.deletions} lines removed`}>
                    <span className="w-2 h-2 rounded-full bg-state-error" />
                    <span className="text-label-sm font-medium text-text-secondary">
                        {summary.deletions} deletion{summary.deletions !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="h-4 w-px bg-border-subtle" />
                <div className="text-label-sm text-text-muted">
                    {summary.changes} total change{summary.changes !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {viewMode === 'side-by-side' ? (
                    <>
                        {/* Version A (Older) */}
                        <div className="flex-1 flex flex-col border-r border-border-subtle min-w-0">
                            <VersionHeader
                                version={versionA}
                                label="Original"
                                color="state-error" // Red/Orange tint for 'before' often used, or neutral. Using error color for diff consistency (deletion side).
                                canNavigate={canNavigateA}
                                onNavigate={(dir) => navigateVersion('A', dir)}
                            />
                            {showMetadata && <VersionMetadataCard version={versionA} />}
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <DiffRenderer
                                    content={versionA.content}
                                    diff={diff}
                                    side="left"
                                    contentType={artifact.contentType}
                                />
                            </div>
                        </div>

                        {/* Version B (Newer) */}
                        <div className="flex-1 flex flex-col min-w-0 bg-background-default">
                            <VersionHeader
                                version={versionB}
                                label="Modified"
                                color="state-success" // Green tint for 'after'
                                canNavigate={canNavigateB}
                                onNavigate={(dir) => navigateVersion('B', dir)}
                                onApprove={() => onApproveVersion(versionB.id)}
                                isCurrent={true}
                            />
                            {showMetadata && <VersionMetadataCard version={versionB} />}
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <DiffRenderer
                                    content={versionB.content}
                                    diff={diff}
                                    side="right"
                                    contentType={artifact.contentType}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    /* Unified View */
                    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto border-x border-border-subtle shadow-xl my-4 bg-background-default">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-background-subtle sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-label-sm text-text-muted font-medium">
                                    Comparing v{versionA.versionNumber} → v{versionB.versionNumber}
                                </span>
                            </div>

                            <button
                                onClick={() => onApproveVersion(versionB.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-label-sm hover:bg-brand-primary/90 transition-colors shadow-sm"
                            >
                                <Check className="w-4 h-4" />
                                Approve v{versionB.versionNumber}
                            </button>
                        </div>
                        {showMetadata && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-background-subtle/30 border-b border-border-subtle">
                                <div>
                                    <div className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Original (v{versionA.versionNumber})</div>
                                    <VersionMetadataCard version={versionA} />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Modified (v{versionB.versionNumber})</div>
                                    <VersionMetadataCard version={versionB} />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <DiffRenderer
                                content={versionB.content}
                                diff={diff}
                                side="unified"
                                contentType={artifact.contentType}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Version Header Sub-component
interface VersionHeaderProps {
    version: ArtifactVersion;
    label: string;
    color: string;
    canNavigate: { prev: boolean; next: boolean };
    onNavigate: (direction: 'prev' | 'next') => void;
    onApprove?: () => void;
    isCurrent?: boolean;
}

const VersionHeader: React.FC<VersionHeaderProps> = ({
    version,
    label,
    color,
    canNavigate,
    onNavigate,
    onApprove,
    isCurrent
}) => (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-border-subtle sticky top-0 z-10 ${isCurrent ? 'bg-background-elevated' : 'bg-background-subtle/30'}`}>
        <div className="flex items-center gap-3">
            {/* Navigation Controls */}
            <div className="flex items-center gap-0.5 bg-background-subtle rounded-md border border-border-subtle p-0.5">
                <button
                    onClick={() => onNavigate('prev')}
                    disabled={!canNavigate.prev}
                    className="p-1 hover:bg-background-elevated rounded text-text-muted hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Older Version"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onNavigate('next')}
                    disabled={!canNavigate.next}
                    className="p-1 hover:bg-background-elevated rounded text-text-muted hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Newer Version"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div>
                <div className="flex items-center gap-2">
                    {/* Status Dot */}
                    <div className={`w-2 h-2 rounded-full bg-${color}`} />

                    <span className={`text-label-md font-semibold text-text-primary`}>
                        {label}
                    </span>
                    <span className="px-1.5 py-0.5 bg-background-subtle rounded text-label-xs font-mono text-text-secondary border border-border-subtle/50">
                        v{version.versionNumber}
                    </span>
                </div>
            </div>

        </div>

        {onApprove && (
            <button
                onClick={onApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-label-sm hover:bg-brand-primary/90 transition-colors shadow-sm ml-auto"
            >
                <Check className="w-4 h-4" />
                Approve This
            </button>
        )}
    </div>
);
