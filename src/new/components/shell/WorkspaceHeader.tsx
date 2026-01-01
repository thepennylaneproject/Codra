import { Link, useLocation } from 'react-router-dom';
import {
    LayoutTemplate,
    FileText,
    PanelLeft,
    PanelRight,
    Search,
    User,
    Settings,
    Zap,
    ChevronDown,
    ArrowLeft,
    Wallet
} from 'lucide-react';
import { Button, IconButton } from '../Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProductionDeskId, PRODUCTION_DESKS } from '../../../domain/types';
import { useState, useRef, useEffect } from 'react';

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
    mode?: 'canvas' | 'studio';
    activeStudioId?: ProductionDeskId;
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
    contextMemory,
    mode = 'canvas',
    activeStudioId
}: WorkspaceHeaderProps) {
    void contextMemory;
    const location = useLocation();
    const isSpread = location.pathname.includes('/spread');
    const isContext = location.pathname.includes('/context');
    const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStudioDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeStudio = activeStudioId ? PRODUCTION_DESKS.find(d => d.id === activeStudioId) : null;

    return (
        <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-ivory)]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 sticky top-0">
                {/* Project Info & Brand */}
                <div className="flex items-center gap-8">
                    <Link to="/projects" className="flex items-center gap-2 group">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-coral)] group-hover:scale-125 transition-transform" />
                        <span className="font-black tracking-tighter text-sm uppercase">Codra</span>
                    </Link>

                    <div className="h-4 w-px bg-[var(--color-border)]" />

                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-ink-muted)] leading-none mb-1">
                            Active Canvas
                        </span>
                        <h1 className="text-xs font-bold text-[var(--color-ink)] leading-none">
                            {projectName}
                        </h1>
                    </div>
                </div>

                {/* Mode Navigation */}
                <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[var(--color-border-soft)] p-1 rounded-full border border-[var(--color-border-soft)]">
                    {mode === 'canvas' ? (
                        <>
                            <Link
                                to={`/p/${projectId}/spread`}
                                className={cn(
                                    "px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    isSpread
                                        ? "bg-white text-[var(--color-ink)] shadow-sm ring-1 ring-[var(--color-border-soft)]"
                                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                                )}
                            >
                                <LayoutTemplate size={12} strokeWidth={1.5} className={isSpread ? "text-[var(--color-brand-coral)]" : ""} />
                                Canvas
                            </Link>
                            <Link
                                to={`/p/${projectId}/context`}
                                className={cn(
                                    "px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    isContext
                                        ? "bg-white text-[var(--color-ink)] shadow-sm ring-1 ring-[var(--color-border-soft)]"
                                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                                )}
                            >
                                <FileText size={12} strokeWidth={1.5} className={isContext ? "text-[var(--color-brand-coral)]" : ""} />
                                Context
                            </Link>

                            {/* Studios Dropdown */}
                            <div className="w-px h-4 bg-border mx-1" />
                            <div className="relative" ref={dropdownRef}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)}
                                    className="rounded-full bg-white/50"
                                    rightIcon={<ChevronDown size={12} strokeWidth={1.5} className={cn("transition-transform", isStudioDropdownOpen && "rotate-180")} />}
                                >
                                    Studios
                                </Button>
                                
                                {isStudioDropdownOpen && (
                                    <div className="absolute top-full mt-2 left-0 min-w-[200px] bg-white rounded-xl border border-[var(--color-border)] shadow-xl py-1 z-50">
                                        {PRODUCTION_DESKS.map((desk) => (
                                            <Link
                                                key={desk.id}
                                                to={`/p/${projectId}/production?desk=${desk.id}`}
                                                onClick={() => setIsStudioDropdownOpen(false)}
                                                className="block px-4 py-2 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-border-soft)] transition-colors"
                                            >
                                                {desk.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Studio Mode: Back to Canvas + Current Studio + Switcher */}
                            <Link
                                to={`/p/${projectId}/spread`}
                                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-white/50"
                            >
                                <ArrowLeft size={12} strokeWidth={1.5} />
                                Canvas
                            </Link>

                            <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

                            <div className="relative" ref={dropdownRef}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)}
                                    className="rounded-full"
                                    rightIcon={<ChevronDown size={12} strokeWidth={1.5} className={cn("transition-transform", isStudioDropdownOpen && "rotate-180")} />}
                                >
                                    {activeStudio?.label || 'Studio'}
                                </Button>
                                
                                {isStudioDropdownOpen && (
                                    <div className="absolute top-full mt-2 left-0 min-w-[200px] bg-white rounded-xl border border-[var(--color-border)] shadow-xl py-1 z-50">
                                        {PRODUCTION_DESKS.map((desk) => (
                                            <Link
                                                key={desk.id}
                                                to={`/p/${projectId}/production?desk=${desk.id}`}
                                                onClick={() => setIsStudioDropdownOpen(false)}
                                                className={cn(
                                                    "block px-4 py-2 text-xs font-bold transition-colors",
                                                    desk.id === activeStudioId
                                                        ? "bg-[var(--color-border-soft)] text-[var(--color-brand-coral)]"
                                                        : "text-[var(--color-ink)] hover:bg-[var(--color-border-soft)]"
                                                )}
                                            >
                                                {desk.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </nav>

                {/* Actions & Docks */}
                <div className="flex items-center gap-4">
                    {/* Context Window Indicator moved to Activity Strip */}

                    <div className="flex items-center gap-1 mr-4">
                        {/* Compact Budget Indicator - key differentiator surfaced */}
                        <div 
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors group"
                            title="Daily Budget Usage - Click to manage"
                        >
                            <Wallet size={14} strokeWidth={1.5} className="text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-700">$12</span>
                            <span className="text-[9px] text-emerald-500">/</span>
                            <span className="text-[10px] font-mono text-emerald-600">$50</span>
                        </div>

                        <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

                        <Link 
                            to={`/coherence-scan?projectId=${projectId}`}
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Run Coherence Scan"
                        >
                            <Zap size={18} strokeWidth={1.5} />
                        </Link>
                        <IconButton 
                            variant="ghost" 
                            size="md" 
                            title="Search"
                            aria-label="Search"
                        >
                            <Search size={18} strokeWidth={1.5} />
                        </IconButton>
                        <IconButton 
                            variant="ghost" 
                            size="md" 
                            title="User Profile"
                            aria-label="User Profile"
                        >
                            <User size={18} strokeWidth={1.5} />
                        </IconButton>
                        <IconButton 
                            variant="ghost" 
                            size="md" 
                            title="Settings"
                            aria-label="Settings"
                        >
                            <Settings size={18} strokeWidth={1.5} />
                        </IconButton>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-border pl-4">
                        <IconButton
                            variant={leftDockVisible ? "secondary" : "ghost"}
                            size="md"
                            onClick={onToggleLeftDock}
                            title="Toggle Left Dock"
                            aria-label="Toggle Left Dock"
                        >
                            <PanelLeft size={20} strokeWidth={1.5} />
                        </IconButton>
                        <IconButton
                            variant={rightDockVisible ? "secondary" : "ghost"}
                            size="md"
                            onClick={onToggleRightDock}
                            title="Toggle Right Dock"
                            aria-label="Toggle Right Dock"
                        >
                            <PanelRight size={20} strokeWidth={1.5} />
                        </IconButton>
                    </div>
                </div>
        </header>
    );
}
