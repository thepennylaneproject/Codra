import { Link, useLocation } from 'react-router-dom';
import {
    LayoutTemplate,
    Search,
    User,
    Settings,
    Wrench
} from 'lucide-react';
import { BudgetBadge } from '@/components/budget/BudgetBadge';
import { Button, IconButton } from '@/components/ui/Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useRef, useEffect } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface WorkspaceHeaderProps {
    projectName: string;
    projectId: string;
    leftDockVisible?: boolean;
    rightDockVisible?: boolean;
    onToggleLeftDock?: () => void;
    onToggleRightDock?: () => void;
    contextMemory?: {
        percentage: number;
        level: 'low' | 'medium' | 'high' | 'critical';
    };
    mode?: 'canvas' | 'studio';
    activeStudioId?: string;
    assistantVisible?: boolean;
    onToggleAssistant?: () => void;
    onToggleProof?: () => void;
    onOpenSettings?: () => void;
    costSummary?: {
        sessionTotal: number;
        budgetRemaining?: number;
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
    assistantVisible,
    onToggleAssistant,
    onToggleProof,
    onOpenSettings,
    costSummary
}: WorkspaceHeaderProps) {
    const location = useLocation();
    const isWorkspace = location.pathname.includes('/workspace');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const showBudget = useFeatureFlag(FEATURE_FLAGS.BUDGET_WIDGET);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="group h-12 border-b border-[var(--ui-border)] bg-[var(--color-ivory)] flex items-center justify-between px-[var(--space-xl)] shrink-0 z-50 sticky top-0">
                {/* Project Info & Brand */}
                <div className="flex items-center gap-6">
                    <Link to="/projects" className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink)] group-hover:scale-125 transition-transform" />
                        <span className="font-semibold tracking-[0.2em] text-xs uppercase">Codra</span>
                    </Link>

                    <div className="h-4 w-px bg-[var(--ui-border)]" />
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-[0.24em] text-text-soft">Workspace</span>
                        <div className="flex items-center gap-2 mt-1">
                            <h1 className="text-title text-text-primary leading-none">{projectName}</h1>
                        </div>
                    </div>
                </div>

                {/* Mode Navigation */}
                <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
                    <Link
                        to={`/p/${projectId}/workspace`}
                        className={cn(
                            "px-1 py-1 text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 border-b-2",
                            isWorkspace
                                ? "text-text-primary border-[var(--color-ink)]"
                                : "text-text-soft border-transparent hover:text-text-primary hover:border-[var(--ui-border)]"
                        )}
                    >
                        <LayoutTemplate size={12} strokeWidth={1.5} className={isWorkspace ? "text-zinc-500" : ""} />
                        Desk
                    </Link>
                </nav>

                {/* Actions & Docks */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 mr-4">
                        {showBudget && costSummary && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <BudgetBadge />
                            </div>
                        )}

                        <div className="relative" ref={toolsMenuRef}>
                            <IconButton
                                variant="ghost"
                                size="md"
                                title="Tools"
                                aria-label="Tools"
                                onClick={() => setIsToolsMenuOpen((open) => !open)}
                                className="text-text-soft/70 hover:text-text-primary"
                            >
                                <Wrench size={16} strokeWidth={1.5} />
                            </IconButton>
                            {isToolsMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-[var(--ui-border)] shadow-xl overflow-hidden z-50">
                                    <Link
                                        to={`/coherence-scan?projectId=${projectId}`}
                                        className="block px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                        onClick={() => setIsToolsMenuOpen(false)}
                                    >
                                        Run coherence scan
                                    </Link>
                                    <button
                                         onClick={() => {
                                             onToggleProof?.();
                                             setIsToolsMenuOpen(false);
                                         }}
                                         className="w-full text-left px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Toggle Proof
                                    </button>
                                </div>
                            )}
                        </div>

                        <IconButton 
                            variant="ghost" 
                            size="md" 
                            title="Search"
                            aria-label="Search"
                            className="text-text-soft/70 hover:text-text-primary"
                        >
                            <Search size={16} strokeWidth={1.5} />
                        </IconButton>
                        <div className="relative" ref={userMenuRef}>
                            <IconButton 
                                variant="ghost" 
                                size="md" 
                                title="User Menu"
                                aria-label="User Menu"
                                onClick={() => setIsUserMenuOpen((open) => !open)}
                                className="text-text-soft/70 hover:text-text-primary"
                            >
                                <User size={16} strokeWidth={1.5} />
                            </IconButton>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-[var(--ui-border)] shadow-xl overflow-hidden z-50">
                                    <Button
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            onOpenSettings?.();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Open settings
                                    </Button>
                                    <Link
                                        to="/settings"
                                        className="block px-4 py-2 text-xs font-semibold text-text-soft hover:text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        Open account settings
                                    </Link>
                                </div>
                            )}
                        </div>
                        <IconButton 
                            variant="ghost" 
                            size="md" 
                            title="Open settings"
                            aria-label="Open settings"
                            onClick={() => onOpenSettings?.()}
                            className="text-text-soft/70 hover:text-text-primary"
                        >
                            <Settings size={16} strokeWidth={1.5} />
                        </IconButton>
                    </div>

                    <div className="flex items-center gap-1 border-l border-[var(--ui-border)] pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton
                            variant={assistantVisible ? "secondary" : "ghost"}
                            size="md"
                            onClick={onToggleAssistant}
                            title="Toggle Assistant"
                            aria-label="Toggle Assistant"
                            className="text-text-soft/70 hover:text-text-primary"
                        >
                            <LayoutTemplate size={18} strokeWidth={1.5} />
                        </IconButton>
                    </div>
                </div>
        </header>
    );
}
