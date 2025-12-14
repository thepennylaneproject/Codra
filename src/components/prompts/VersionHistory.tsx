import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import { PromptVersion } from '../../types/prompt';

interface VersionHistoryProps {
    versions: PromptVersion[];
    currentVersion: number;
    onRestore: (version: PromptVersion) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, currentVersion, onRestore }) => {
    return (
        <div className="flex flex-col h-full bg-surface-sidebar border-l border-border-subtle w-80">
            <div className="p-4 border-b border-border-subtle flex items-center gap-2">
                <History className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-sm text-text-primary">Version History</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {versions.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-4">No history available</p>
                )}

                {versions.map((version) => (
                    <div
                        key={version.id}
                        className={`p-3 rounded-lg border text-sm transition-all ${version.version === currentVersion
                                ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                                : 'bg-surface-card border-border-subtle hover:border-border-hover'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${version.version === currentVersion ? 'bg-indigo-500 text-white' : 'bg-white/10 text-text-muted'
                                }`}>
                                v{version.version}
                            </span>
                            <span className="text-xs text-text-muted">
                                {new Date(version.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <p className="text-text-secondary mb-3 italic">
                            "{version.changeNote || 'No change note'}"
                        </p>

                        {version.version !== currentVersion && (
                            <button
                                onClick={() => onRestore(version)}
                                className="flex items-center gap-2 w-full justify-center px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary text-xs transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore this version
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
