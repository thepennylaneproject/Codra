import React, { useEffect, useRef } from 'react';
import {
    X,
    RotateCcw,
    Clock,
    AlertCircle,
    CheckCircle2,
    Activity
} from 'lucide-react';
import { ExecutionResult, StepResult } from '../../lib/flow/types';
import {
    SuccessIcon,
    ErrorIcon,
    LoadingIcon,
    ExecuteIcon
} from '../icons';

interface FlowExecutionPanelProps {
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
    steps: StepResult[];
    result: ExecutionResult | null;
    onClose: () => void;
    onRunAgain: () => void;
}

export const FlowExecutionPanel: React.FC<FlowExecutionPanelProps> = ({
    status,
    steps,
    result,
    onClose,
    onRunAgain
}) => {
    const stepsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of steps
    useEffect(() => {
        if (stepsEndRef.current) {
            stepsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [steps]);

    const getStatusColor = () => {
        switch (status) {
            case 'running': return 'text-brand-magenta';
            case 'completed': return 'text-state-success';
            case 'error': return 'text-state-error';
            default: return 'text-zinc-400';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'running': return 'Executing Flow...';
            case 'completed': return 'Execution Complete';
            case 'error': return 'Execution Failed';
            default: return 'Ready to Run';
        }
    };

    return (
        <div className="absolute top-20 right-4 w-96 bg-background-elevated border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-8rem)] z-30 animate-in slide-in-from-right-10 fade-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/5 ${getStatusColor()}`}>
                        {status === 'running' ? <LoadingIcon size={20} /> :
                            status === 'completed' ? <SuccessIcon size={20} /> :
                                status === 'error' ? <ErrorIcon size={20} /> :
                                    <ExecuteIcon size={20} />}
                    </div>
                    <div>
                        <h3 className="font-medium text-sm text-zinc-100">{getStatusText()}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            {status === 'running' && (
                                <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    Step {steps.length + 1}
                                </span>
                            )}
                            {result && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {result.duration}ms
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {status !== 'running' && (
                        <button
                            onClick={onRunAgain}
                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            title="Run Again"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Close Panel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Steps List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {steps.length === 0 && status === 'idle' && (
                    <div className="text-center py-10 text-zinc-500 text-sm">
                        Click Run to execute this flow
                    </div>
                )}

                {steps.map((step, index) => (
                    <div
                        key={`${step.nodeId}-${index}`}
                        className={`p-3 rounded-lg border text-sm transition-all duration-200 ${step.success
                            ? 'bg-white/5 border-white/5'
                            : 'bg-red-500/10 border-red-500/20'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                {step.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-state-success shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-state-error shrink-0" />
                                )}
                                <span className="text-zinc-200 font-medium truncate max-w-[180px]">
                                    {step.nodeId}
                                </span>
                            </div>
                            <span className="text-xs text-zinc-500 tabular-nums">
                                {step.duration}ms
                            </span>
                        </div>
                        {step.error && (
                            <div className="mt-2 text-xs text-state-error bg-red-500/5 p-2 rounded">
                                {step.error}
                            </div>
                        )}
                        {step.outputs && (
                            <div className="mt-2">
                                <details className="group">
                                    <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 select-none flex items-center gap-1">
                                        <span className="group-open:rotate-90 transition-transform">▶</span>
                                        Show Output
                                    </summary>
                                    <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono">
                                        {JSON.stringify(step.outputs, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                ))}

                {status === 'completed' && result && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Final Output</h4>
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <pre className="text-xs text-brand-teal font-mono overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(result.outputs, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
                <div ref={stepsEndRef} />
            </div>

            {/* Error Message Footer */}
            {result?.error && (
                <div className="p-4 bg-red-500/10 border-t border-red-500/20">
                    <div className="flex items-start gap-2 text-state-error text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-medium">{result.error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
