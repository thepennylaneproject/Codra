import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Standard Error Boundary for Codra specialized desks and widgets.
 * Prevents a single broken desk from crashing the entire workspace.
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary:${this.props.name || 'Global'}] uncaught error:`, error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-zinc-950/50 backdrop-blur-xl border border-rose-500/20 rounded-3xl m-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 bg-rose-500/10 rounded-full mb-8"
                    >
                        <AlertCircle className="text-rose-500" size={48} />
                    </motion.div>

                    <h2 className="text-2xl font-black tracking-tight text-white mb-4 uppercase">
                        Workspace Interrupted
                    </h2>

                    <p className="text-zinc-400 text-sm max-w-md leading-relaxed mb-8 font-mono">
                        A critical failure occurred in the <span className="text-rose-400">[{this.props.name || 'System'}]</span> module.
                        Lyra has been notified of the trace.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-white/5"
                        >
                            <RefreshCcw size={14} />
                            Reset Engine
                        </button>

                        <a
                            href="/"
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all border border-zinc-800"
                        >
                            <Home size={14} />
                            Exit to Deck
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
