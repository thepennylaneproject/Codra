import React from 'react';
import { Check, X } from 'lucide-react';
import { CodeDiff } from '../../lib/ai/code';

interface DiffViewerProps {
    diff: CodeDiff;
    onAccept: () => void;
    onReject: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, onAccept, onReject }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-zinc-700 flex items-center justify-between bg-zinc-900">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-100">Proposed Changes</h3>
                        <p className="text-sm text-zinc-400">{diff.explanation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onReject}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20"
                        >
                            <Check className="w-4 h-4" /> Accept Changes
                        </button>
                    </div>
                </div>

                {/* Diff View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Original */}
                    <div className="flex-1 border-r border-zinc-800 flex flex-col bg-zinc-950">
                        <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-wider text-center">
                            Original
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="font-mono text-sm text-red-300/80 whitespace-pre-wrap">
                                {diff.original || <span className="text-zinc-600 opacity-50 italic">Empty</span>}
                            </pre>
                        </div>
                    </div>

                    {/* Modified */}
                    <div className="flex-1 flex flex-col bg-zinc-950">
                        <div className="px-4 py-2 bg-green-900/10 border-b border-zinc-800 text-xs font-mono text-green-500 uppercase tracking-wider text-center">
                            Modified
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="font-mono text-sm text-green-300/80 whitespace-pre-wrap">
                                {diff.modified}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Footer info/legend */}
                <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500 flex justify-center gap-6">
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500/50 rounded-full"></div> Removal</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500/50 rounded-full"></div> Addition</span>
                </div>
            </div>
        </div>
    );
};
