import { Link, useLocation } from 'react-router-dom';
import {
    LayoutTemplate,
    FileText,
    PanelLeft,
    PanelRight,
    Search,
    User,
    Settings,
    Brain,
    Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ContextWindowBadge } from '../ContextWindowIndicator';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface WorkspaceHeaderProps {
    projectName: string;
    projectId: string;
    leftDockVisible: boolean;
    rightDockVisible: boolean;
    onToggleLeftDock: () => void;
    onToggleRightDock: () => void;
    contextMemory?: {
        percentage: number;
        level: 'low' | 'medium' | 'high' | 'critical';
    };
}

/**
 * WORKSPACE HEADER
 * The top navigation bar for the Codra creative workspace.
 * Clean, bold typography and Ivory & Ink aesthetic.
 */
export function WorkspaceHeader({
    projectName,
    projectId,
    leftDockVisible,
    rightDockVisible,
    onToggleLeftDock,
    onToggleRightDock,
    contextMemory
}: WorkspaceHeaderProps) {
    const location = useLocation();
    const isSpread = location.pathname.includes('/spread');
    const isContext = location.pathname.includes('/context');

    return (
        <header className="h-14 border-b border-[#1A1A1A]/10 bg-[#FFFAF0]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 sticky top-0">
            {/* Project Info & Brand */}
            <div className="flex items-center gap-8">
                <Link to="/projects" className="flex items-center gap-2 group">
                    <div className="w-2 h-2 rounded-full bg-[#FF4D4D] group-hover:scale-125 transition-transform" />
                    <span className="font-black tracking-tighter text-sm uppercase">Codra</span>
                </Link>

                <div className="h-4 w-px bg-[#1A1A1A]/10" />

                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8A8A] leading-none mb-1">
                        Active Workspace
                    </span>
                    <h1 className="text-xs font-bold text-[#1A1A1A] leading-none">
                        {projectName}
                    </h1>
                </div>
            </div>

            {/* Mode Navigation */}
            <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1A1A1A]/5 p-1 rounded-full border border-[#1A1A1A]/5">
                <Link
                    to={`/p/${projectId}/spread`}
                    className={cn(
                        "px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        isSpread
                            ? "bg-white text-[#1A1A1A] shadow-sm ring-1 ring-[#1A1A1A]/5"
                            : "text-[#8A8A8A] hover:text-[#1A1A1A]"
                    )}
                >
                    <LayoutTemplate size={12} className={isSpread ? "text-[#FF4D4D]" : ""} />
                    Spread
                </Link>
                <Link
                    to={`/p/${projectId}/context`}
                    className={cn(
                        "px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        isContext
                            ? "bg-white text-[#1A1A1A] shadow-sm ring-1 ring-[#1A1A1A]/5"
                            : "text-[#8A8A8A] hover:text-[#1A1A1A]"
                    )}
                >
                    <FileText size={12} className={isContext ? "text-[#FF4D4D]" : ""} />
                    Context
                </Link>
            </nav>

            {/* Actions & Docks */}
            <div className="flex items-center gap-4">
                {/* Context Memory Indicator */}
                {contextMemory && (
                    <div className="flex items-center gap-2 pr-4 border-r border-[#1A1A1A]/10">
                        <Brain size={14} className="text-[#8A8A8A]" />
                        <ContextWindowBadge 
                            level={contextMemory.level} 
                            percentage={contextMemory.percentage} 
                        />
                    </div>
                )}
                
                <div className="flex items-center gap-1 mr-4">
                    <Link 
                        to={`/coherence-scan?projectId=${projectId}`}
                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Run Coherence Scan"
                    >
                        <Zap size={18} strokeWidth={3} />
                    </Link>
                    <button className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-xl transition-all">
                        <Search size={18} />
                    </button>
                    <button className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-xl transition-all">
                        <User size={18} />
                    </button>
                    <button className="p-2 text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-xl transition-all">
                        <Settings size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-1.5 border-l border-[#1A1A1A]/10 pl-4">
                    <button
                        onClick={onToggleLeftDock}
                        className={cn(
                            "p-2 rounded-xl transition-all",
                            leftDockVisible
                                ? "bg-[#1A1A1A]/5 text-[#FF4D4D]"
                                : "text-[#8A8A8A] hover:bg-[#1A1A1A]/5"
                        )}
                        title="Toggle Left Dock"
                    >
                        <PanelLeft size={20} />
                    </button>
                    <button
                        onClick={onToggleRightDock}
                        className={cn(
                            "p-2 rounded-xl transition-all",
                            rightDockVisible
                                ? "bg-[#1A1A1A]/5 text-[#FF4D4D]"
                                : "text-[#8A8A8A] hover:bg-[#1A1A1A]/5"
                        )}
                        title="Toggle Right Dock"
                    >
                        <PanelRight size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}
