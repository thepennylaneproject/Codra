/**
 * ARTIFACT HISTORY PANEL
 * Timeline sidebar showing all versions of an artifact
 * Supports comparison selection and restore functionality
 */

import React, { useState } from 'react';
import { History, GitCompare } from 'lucide-react';
import type { ArtifactVersion, Artifact } from '../../../types/architect';
import { ArtifactVersionCard } from './ArtifactVersionCard';
import { ArtifactStatusBadge } from './ArtifactStatusBadge';

interface ArtifactHistoryPanelProps {
    artifact: Artifact;
    versions: ArtifactVersion[];
    currentVersionId: string;
    onSelectVersion: (versionId: string) => void;
    onCompareVersions: (versionIdA: string, versionIdB: string) => void;
    onRestoreVersion: (versionId: string) => void;
}

export const ArtifactHistoryPanel: React.FC<ArtifactHistoryPanelProps> = ({
    artifact,
    versions,
    currentVersionId,
    onSelectVersion,
    onCompareVersions,
    onRestoreVersion,
}) => {
    const [compareMode, setCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

    const handleVersionClick = (versionId: string) => {
        if (compareMode) {
            if (selectedForCompare.includes(versionId)) {
                setSelectedForCompare(prev => prev.filter(id => id !== versionId));
            } else if (selectedForCompare.length < 2) {
                const newSelected = [...selectedForCompare, versionId];
                setSelectedForCompare(newSelected);

                if (newSelected.length === 2) {
                    onCompareVersions(newSelected[0], newSelected[1]);
                    setCompareMode(false);
                    setSelectedForCompare([]);
                }
            }
        } else {
            onSelectVersion(versionId);
        }
    };

    const toggleCompareMode = () => {
        setCompareMode(!compareMode);
        setSelectedForCompare([]);
    };

    return (
        <div className="w-80 h-full flex flex-col bg-background-elevated border-l border-border-subtle">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-text-muted" />
                        <h3 className="text-sm text-text-primary font-semibold">Version History</h3>
                    </div>
                    <ArtifactStatusBadge status={artifact.status} size="sm" />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                        {versions.length} version{versions.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={toggleCompareMode}
                        className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${compareMode
                                ? 'bg-brand-teal/20 text-brand-teal'
                                : 'text-text-muted hover:text-text-primary hover:bg-background-subtle'
                            }`}
                    >
                        <GitCompare className="w-3.5 h-3.5" />
                        {compareMode ? 'Cancel' : 'Compare'}
                    </button>
                </div>

                {compareMode && (
                    <div className="mt-3 p-2 bg-brand-teal/10 rounded-lg border border-brand-teal/20">
                        <p className="text-xs text-brand-teal">
                            Select 2 versions to compare ({selectedForCompare.length}/2 selected)
                        </p>
                    </div>
                )}
            </div>

            {/* Version List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {versions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xs text-text-muted">No versions yet</p>
                    </div>
                ) : (
                    versions.map((version, index) => (
                        <ArtifactVersionCard
                            key={version.id}
                            version={version}
                            isLatest={index === 0}
                            isCurrent={version.id === currentVersionId}
                            isSelected={selectedForCompare.includes(version.id)}
                            compareMode={compareMode}
                            onClick={() => handleVersionClick(version.id)}
                            onRestore={() => onRestoreVersion(version.id)}
                            onView={() => onSelectVersion(version.id)}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border-subtle">
                <div className="text-xs text-text-soft text-center">
                    <span className="text-text-muted">Created </span>
                    {new Date(artifact.createdAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};
