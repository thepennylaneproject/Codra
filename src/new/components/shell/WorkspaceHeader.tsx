import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutTemplate,
    FileText,
    PanelLeft,
    PanelRight,
    Search,
    User,
    Settings,
    ChevronDown,
    Wrench
} from 'lucide-react';
import { BudgetBadge } from '@/components/budget/BudgetBadge';
import { Button, IconButton } from '@/components/ui/Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProductionDeskId, PRODUCTION_DESKS } from '../../../domain/types';
import { useState, useRef, useEffect } from 'react';
import { useStudioMode } from '@/hooks/useStudioMode';
import { analytics } from '@/lib/analytics';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

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
    onOpenSettings?: () => void;
    onOpenExport?: () => void;
    onToggleActivity?: () => void;
    onOpenAssets?: () => void;
    onOpenLyra?: () => void;
    contextMemory?: {
        percentage: number;
        level: 'low' | 'medium' | 'high' | 'critical';
    };
    statusLabel?: string;
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
    onOpenSettings,
    onOpenExport,
    onToggleActivity,
    onOpenAssets,
    onOpenLyra,
    contextMemory,
    statusLabel,
    mode = 'canvas',
    activeStudioId
}: WorkspaceHeaderProps) {
    void contextMemory;
    const location = useLocation();
    const navigate = useNavigate();
    const isWorkspace = location.pathname.includes('/workspace');
    const isContext = location.pathname.includes('/context');
    const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const { studioEnabled, setStudioEnabled } = useStudioMode();
    const showBudget = useFeatureFlag(FEATURE_FLAGS.BUDGET_WIDGET);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStudioDropdownOpen(false);
            }
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

    const activeStudio = activeStudioId ? PRODUCTION_DESKS.find(d => d.id === activeStudioId) : null;
    const handleStudioToggle = () => {
        const next = !studioEnabled;
        setStudioEnabled(next);
        if (next) {
            analytics.track('studio_toggle_enabled', { source: 'workspace_header' });
        } else if (mode === 'studio') {
            navigate(`/p/${projectId}/workspace`);
        }
    };

    return (
        <header className="group h-12 glass-panel-light border-0 border-b border-[var(--ui-border)] rounded-none bg-[var(--ui-bg)]/80 flex items-center justify-between px-[var(--space-xl)] shrink-0 z-50 sticky top-0">
                {/* Project Info & Brand */}
                <div className="flex items-center gap-6">
                    <Link to="/projects" className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:scale-125 transition-transform" />
                        <span className="font-semibold tracking-tighter text-xs">Codra</span>
                    </Link>

                    <div className="h-4 w-px bg-[var(--ui-border)]" />
                    <div className="flex flex-col">
                        <span className="text-meta text-text-soft">Workspace</span>
                        <div className="flex items-center gap-2 mt-1">
                            <h1 className="text-title text-text-primary leading-none">{projectName}</h1>
                            {statusLabel && (
                                <span className="text-helper text-text-soft">{statusLabel}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mode Navigation */}
                <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[var(--ui-border-soft)]/70 p-0.5 rounded-full border border-[var(--ui-border-soft)]">
                    {mode === 'canvas' ? (
                        <>
                            <Link
                                to={`/p/${projectId}/workspace`}
                                className={cn(
                                    "px-5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-2",
                                    isWorkspace
                                        ? "bg-white text-text-primary shadow-sm ring-1 ring-[var(--ui-border-soft)]"
                                        : "text-text-soft hover:text-text-primary"
                                )}
                            >
                                <LayoutTemplate size={11} strokeWidth={1.5} className={isWorkspace ? "text-zinc-500" : ""} />
                                Workspace
                            </Link>
                            <Link
                                to={`/p/${projectId}/context`}
                                className={cn(
                                    "px-5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-2",
                                    isContext
                                        ? "bg-white text-text-primary shadow-sm ring-1 ring-[var(--ui-border-soft)]"
                                        : "text-text-soft hover:text-text-primary"
                                )}
                            >
                                <FileText size={11} strokeWidth={1.5} className={isContext ? "text-zinc-500" : ""} />
                                Context
                            </Link>

                            {studioEnabled && (
                                <>
                                    {/* Studios Dropdown */}
                                    <div className="w-px h-4 bg-[var(--ui-border)] mx-1" />
                                    <div className="relative" ref={dropdownRef}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)}
                                            className="rounded-full bg-white/50"
                                            rightIcon={<ChevronDown size={12} strokeWidth={1.5} className={cn("transition-transform", isStudioDropdownOpen && "rotate-180")} />}
                                        >
                                            Studio workspaces
                                        </Button>
                                        
                                        {isStudioDropdownOpen && (
                                            <div className="absolute top-full mt-2 left-0 min-w-[200px] bg-white rounded-xl border border-[var(--ui-border)] shadow-xl py-1 z-50">
                                                {PRODUCTION_DESKS.map((desk) => (
                                                    <Link
                                                        key={desk.id}
                                                        to={`/p/${projectId}/production?desk=${desk.id}`}
                                                        onClick={() => setIsStudioDropdownOpen(false)}
                                                        className="block px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                                    >
                                                        {desk.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Studio Mode: Back to Canvas + Current Studio + Switcher */}
                            <Link
                                to={`/p/${projectId}/workspace`}
                                className="px-4 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-2 text-text-soft hover:text-text-primary hover:bg-white/50"
                            >
                                Workspace
                            </Link>

                            <div className="w-px h-4 bg-[var(--ui-border)] mx-1" />

                            <div className="relative" ref={dropdownRef}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsStudioDropdownOpen(!isStudioDropdownOpen)}
                                    className="rounded-full"
                                    rightIcon={<ChevronDown size={12} strokeWidth={1.5} className={cn("transition-transform", isStudioDropdownOpen && "rotate-180")} />}
                                >
                                    {activeStudio?.label || 'Studio workspace'}
                                </Button>
                                
                                {isStudioDropdownOpen && (
                                    <div className="absolute top-full mt-2 left-0 min-w-[200px] bg-white rounded-xl border border-[var(--ui-border)] shadow-xl py-1 z-50">
                                        {PRODUCTION_DESKS.map((desk) => (
                                            <Link
                                                key={desk.id}
                                                to={`/p/${projectId}/production?desk=${desk.id}`}
                                                onClick={() => setIsStudioDropdownOpen(false)}
                                                className={cn(
                                                    "block px-4 py-2 text-xs font-semibold transition-colors",
                                                    desk.id === activeStudioId
                                                        ? "bg-[var(--ui-border-soft)] text-zinc-500"
                                                        : "text-text-primary hover:bg-[var(--ui-border-soft)]"
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
                        {showBudget && (
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
                                    <Button
                                        onClick={() => {
                                            setIsToolsMenuOpen(false);
                                            onOpenExport?.();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Export
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsToolsMenuOpen(false);
                                            onToggleActivity?.();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Open activity
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsToolsMenuOpen(false);
                                            onOpenAssets?.();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Open assets
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsToolsMenuOpen(false);
                                            onOpenLyra?.();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Open Lyra module
                                    </Button>
                                    <Link
                                        to={`/coherence-scan?projectId=${projectId}`}
                                        className="block px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                        onClick={() => setIsToolsMenuOpen(false)}
                                    >
                                        Run coherence scan
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            setIsToolsMenuOpen(false);
                                            handleStudioToggle();
                                        }}
                                        className="w-full px-4 py-2 text-xs font-semibold text-text-primary hover:bg-[var(--ui-border-soft)] transition-colors"
                                    >
                                        Switch Studio workspace
                                    </Button>
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
                            variant={leftDockVisible ? "secondary" : "ghost"}
                            size="md"
                            onClick={onToggleLeftDock}
                            title="Switch left dock"
                            aria-label="Switch left dock"
                            className="text-text-soft/70 hover:text-text-primary"
                        >
                            <PanelLeft size={18} strokeWidth={1.5} />
                        </IconButton>
                        <IconButton
                            variant={rightDockVisible ? "secondary" : "ghost"}
                            size="md"
                            onClick={onToggleRightDock}
                            title="Switch right dock"
                            aria-label="Switch right dock"
                            className="text-text-soft/70 hover:text-text-primary"
                        >
                            <PanelRight size={18} strokeWidth={1.5} />
                        </IconButton>
                    </div>
                </div>
        </header>
    );
}
