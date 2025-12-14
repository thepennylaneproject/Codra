import React, { useState } from 'react';
import { Download, Upload, Save, FolderOpen, Play, Square, Loader2 } from 'lucide-react';
import { useFlowStore } from './store';
import { useReactFlow } from '@xyflow/react';
import { useFlowExecution } from '../../hooks/useFlowExecution';

export const FlowToolbar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { setNodes, setEdges, nodes, edges } = useFlowStore();
    const { toObject, setViewport } = useReactFlow();
    const [showResults, setShowResults] = useState(false);

    const {
        isExecuting,
        result,
        error,
        execute,
        cancel,
        reset,
    } = useFlowExecution({
        onComplete: (result) => {
            console.log('Flow completed:', result);
            setShowResults(true);
        },
        onError: (err) => {
            console.error('Flow error:', err);
        },
    });

    // Check if flow supports running (needs at least trigger node)
    const hasTrigger = nodes.some(n => n.type === 'trigger');
    const canRun = hasTrigger && !isExecuting;

    const handleRun = async () => {
        if (!hasTrigger) {
            alert('Flow must have a trigger node to execute');
            return;
        }

        const flow = {
            nodes: nodes,
            edges: edges,
        };

        await execute(flow, {});
    };

    const handleSave = () => {
        const flow = toObject();
        localStorage.setItem('codra-flow-backup', JSON.stringify(flow));
        alert('Flow saved to local storage!');
    };

    const handleLoad = () => {
        const flowStr = localStorage.getItem('codra-flow-backup');
        if (flowStr) {
            const flow = JSON.parse(flowStr);
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
            const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
            setViewport({ x, y, zoom });
        }
    };

    const handleExport = () => {
        const flow = toObject();
        const jsonString = JSON.stringify(flow, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'codra-flow.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const flow = JSON.parse(e.target?.result as string);
                    if (flow.nodes && flow.edges) {
                        setNodes(flow.nodes);
                        setEdges(flow.edges);
                        if (flow.viewport) {
                            const { x, y, zoom } = flow.viewport;
                            setViewport({ x, y, zoom });
                        }
                    }
                } catch (error) {
                    console.error('Failed to parse flow', error);
                    alert('Invalid flow file');
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div className="flex gap-2">
                {children}

                {/* Run Controls */}
                <div className="flex bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1">
                    {isExecuting ? (
                        <>
                            <button
                                onClick={cancel}
                                className="p-2 hover:bg-zinc-800 rounded text-red-400 hover:text-red-300 transition-colors"
                                title="Stop Execution"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </button>
                            <div className="p-2 text-brand-teal flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={handleRun}
                            disabled={!canRun}
                            className={`p-2 rounded transition-colors ${canRun
                                    ? 'text-brand-teal hover:bg-zinc-800 hover:text-brand-teal/80'
                                    : 'text-zinc-600 cursor-not-allowed'
                                }`}
                            title="Run Flow"
                        >
                            <Play className="w-4 h-4 fill-current" />
                        </button>
                    )}
                </div>

                <div className="flex bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1">
                    <button
                        onClick={handleSave}
                        className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Save to Local Storage"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleLoad}
                        className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Load from Local Storage"
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg p-1">
                    <button
                        onClick={handleExport}
                        className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                        title="Export JSON"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <label
                        className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer transition-colors"
                        title="Import JSON"
                    >
                        <Upload className="w-4 h-4" />
                        <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleImport}
                        />
                    </label>
                </div>
            </div>

            {/* Results Panel */}
            {showResults && result && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white text-lg">
                            Execution Results
                        </h3>
                        <button
                            onClick={() => {
                                setShowResults(false);
                                reset();
                            }}
                            className="text-zinc-400 hover:text-white transition-colors"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div
                        className={`px-3 py-2 rounded mb-4 font-medium ${result.success
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                    >
                        {result.success ? '✓ Flow completed successfully' : `✕ ${result.error}`}
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-zinc-400">
                            <span>Duration</span>
                            <span className="text-white font-mono">{result.duration}ms</span>
                        </div>

                        <div className="flex justify-between text-zinc-400">
                            <span>Steps executed</span>
                            <span className="text-white font-mono">{result.steps.length}</span>
                        </div>

                        {result.cost > 0 && (
                            <div className="flex justify-between text-zinc-400">
                                <span>Estimated cost</span>
                                <span className="text-white font-mono">${result.cost.toFixed(4)}</span>
                            </div>
                        )}

                        {Object.keys(result.outputs).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
                                    Outputs
                                </span>
                                <pre className="mt-2 p-3 bg-zinc-950/50 rounded text-xs text-zinc-300 overflow-auto max-h-40 border border-zinc-800">
                                    {JSON.stringify(result.outputs, null, 2)}
                                </pre>
                            </div>
                        )}

                        {result.steps.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <span className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">
                                    Execution Steps
                                </span>
                                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                    {result.steps.map((step, idx) => (
                                        <div
                                            key={idx}
                                            className="text-xs text-zinc-400 px-2 py-1 bg-zinc-950/30 rounded"
                                        >
                                            <span
                                                className={`inline-block w-3 h-3 rounded-full mr-2 ${step.success
                                                        ? 'bg-emerald-500'
                                                        : 'bg-red-500'
                                                    }`}
                                            />
                                            {step.nodeId} ({step.duration}ms)
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && !showResults && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-red-900/90 backdrop-blur-md border border-red-700 rounded-lg p-4 text-red-200 text-sm shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Execution Error</span>
                        <button
                            onClick={reset}
                            className="text-red-300 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="mt-2 text-red-100">{error}</p>
                </div>
            )}
        </div>
    );
};
