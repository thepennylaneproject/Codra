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
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-red-200 rounded-3xl m-6 shadow-xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-6 bg-red-50 rounded-full mb-8"
                    >
                        <AlertCircle className="text-red-500" size={48} />
                    </motion.div>

                    <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mb-4">
                        Something went wrong
                    </h2>

                    <p className="text-[#5A5A5A] text-sm max-w-md leading-relaxed mb-8">
                        An error occurred in the <span className="text-red-500 font-bold">{this.props.name || 'system'}</span> component.
                        This has been logged for review.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#FF4D4D] text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl"
                        >
                            <RefreshCcw size={14} />
                            Reload Page
                        </button>

                        <a
                            href="/"
                            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#5A5A5A] hover:text-[#1A1A1A] font-bold uppercase tracking-widest text-xs rounded-xl transition-all border border-[#1A1A1A]/10"
                        >
                            <Home size={14} />
                            Go to Projects
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
