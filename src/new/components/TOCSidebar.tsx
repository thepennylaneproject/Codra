/**
 * TOC SIDEBAR
 * Enhanced Table of Contents navigation for the Spread
 * Supports category grouping, keyboard navigation, and status indicators
 */

import { useEffect, useCallback } from 'react';
import { TOCEntry, EnhancedTOCEntry, TOCSectionCategory } from '../../domain/types';
import { Button } from '@/components/ui/Button';
import {
    List,
    ChevronRight,
    FileText,
    Palette,
    PenTool,
    HelpCircle,
    Circle,
    CheckCircle2,
    Clock,
} from 'lucide-react';

// ============================================
// Category Configuration
// ============================================

interface CategoryConfig {
    label: string;
    icon: typeof FileText;
}

const CATEGORY_CONFIG: Record<TOCSectionCategory, CategoryConfig> = {
    assignment: { label: 'Assignment', icon: FileText },
    editorial_direction: { label: 'Editorial Direction', icon: PenTool },
    visual_direction: { label: 'Visual Direction', icon: Palette },
    production_desk: { label: 'Studio workspaces', icon: List },
    project_tool: { label: 'Project Tools', icon: List },
    open_questions: { label: 'Open Questions', icon: HelpCircle },
};

const STATUS_ICONS = {
    pending: Circle,
    'in-progress': Clock,
    complete: CheckCircle2,
};

const STATUS_COLORS = {
    pending: 'text-zinc-300',
    'in-progress': 'text-amber-500',
    complete: 'text-emerald-500',
};

// ============================================
// Types
// ============================================

interface TOCSidebarProps {
    entries: (TOCEntry | EnhancedTOCEntry)[];
    activeSectionId: string | null;
    onNavigate: (sectionId: string) => void;
    showCategories?: boolean;
    enableKeyboard?: boolean;
    hasInsights?: boolean;
}

// ============================================
// Helper Functions
// ============================================

function isEnhancedEntry(entry: TOCEntry | EnhancedTOCEntry): entry is EnhancedTOCEntry {
    return 'category' in entry;
}

function groupByCategory(entries: (TOCEntry | EnhancedTOCEntry)[]): Map<TOCSectionCategory | 'uncategorized', (TOCEntry | EnhancedTOCEntry)[]> {
    const groups = new Map<TOCSectionCategory | 'uncategorized', (TOCEntry | EnhancedTOCEntry)[]>();

    for (const entry of entries) {
        const category = isEnhancedEntry(entry) ? entry.category : 'uncategorized';
        const existing = groups.get(category) || [];
        groups.set(category, [...existing, entry]);
    }

    return groups;
}

// ============================================
// Component
// ============================================

export function TOCSidebar({
    entries,
    activeSectionId,
    onNavigate,
    showCategories = true,
    enableKeyboard = true,
    hasInsights = false,
}: TOCSidebarProps) {
    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enableKeyboard) return;

        // Number keys 1-9 for quick navigation
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
            const entry = entries[num - 1];
            if (entry) {
                onNavigate(entry.sectionId);
            }
        }
    }, [entries, onNavigate, enableKeyboard]);

    useEffect(() => {
        if (enableKeyboard) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown, enableKeyboard]);

    // Group entries by category if showCategories is enabled
    const hasEnhancedEntries = entries.some(isEnhancedEntry);
    const groupedEntries = showCategories && hasEnhancedEntries
        ? groupByCategory(entries)
        : null;

    return (
        <div className="h-full flex flex-col bg-[#FFFAF0]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1A1A1A]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <List size={14} className="text-text-primary" />
                    <span className="text-xs font-semibold text-text-primary">
                        Sector Index
                    </span>
                </div>
                {enableKeyboard && (
                    <span className="text-xs font-semibold text-text-soft">1-9 to navigate</span>
                )}
                {hasInsights && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full animate-pulse">
                        <List size={10} className="hidden" /> {/* Spacer */}
                        <span className="text-xs font-semibold">New Insights</span>
                    </div>
                )}
            </div>

            {/* TOC List */}
            <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {groupedEntries ? (
                    // Categorized view
                    <div className="space-y-6">
                        {Array.from(groupedEntries.entries()).map(([category, categoryEntries]) => {
                            const config = category === 'uncategorized'
                                ? { label: 'General', icon: FileText }
                                : CATEGORY_CONFIG[category as TOCSectionCategory];

                            const CategoryIcon = config.icon;

                            return (
                                <div key={category} className="px-2">
                                    {/* Category Header */}
                                    <div className="px-4 py-2 flex items-center gap-2 mb-1 border-b border-[#1A1A1A]/5">
                                        <CategoryIcon size={12} className="text-zinc-500" />
                                        <span className="text-xs font-semibold text-text-soft">
                                            {config.label}
                                        </span>
                                    </div>

                                    {/* Category Entries */}
                                    <ul className="space-y-0">
                                        {categoryEntries.map((entry) => (
                                            <TOCEntryItem
                                                key={entry.id}
                                                entry={entry}
                                                index={entries.indexOf(entry)}
                                                isActive={entry.sectionId === activeSectionId}
                                                onNavigate={onNavigate}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Flat view
                    <ul className="space-y-0 px-2">
                        {entries.map((entry, index) => (
                            <TOCEntryItem
                                key={entry.id}
                                entry={entry}
                                index={index}
                                isActive={entry.sectionId === activeSectionId}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </ul>
                )}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1A1A1A]/10 bg-[#1A1A1A]/5">
                <p className="text-xs font-semibold text-text-soft">
                    No additional sections configured
                </p>
            </div>
        </div>
    );
}

// ============================================
// Entry Item Component
// ============================================

interface TOCEntryItemProps {
    entry: TOCEntry | EnhancedTOCEntry;
    index: number;
    isActive: boolean;
    onNavigate: (sectionId: string) => void;
}

function TOCEntryItem({ entry, index, isActive, onNavigate }: TOCEntryItemProps) {
    const enhanced = isEnhancedEntry(entry);
    const StatusIcon = enhanced ? STATUS_ICONS[entry.status] : null;
    const statusColor = enhanced ? STATUS_COLORS[entry.status] : '';

    return (
        <li>
            <Button
                onClick={() => onNavigate(entry.sectionId)}
                className={`
                    w-full px-4 py-2 text-left flex items-center gap-3 group
                    transition-all duration-200 rounded-lg
                    ${isActive
                        ? 'bg-[#1A1A1A] text-white shadow-md'
                        : 'text-text-primary/60 hover:text-text-primary hover:bg-[#1A1A1A]/5'
                    }
                `}
            >
                {/* Order Number / Status */}
                {StatusIcon ? (
                    <StatusIcon size={12} className={`flex-shrink-0 ${isActive ? 'text-zinc-500' : statusColor}`} />
                ) : (
                    <span className={`
                        font-mono text-xs w-4 flex-shrink-0
                        ${isActive ? 'text-zinc-500' : 'text-text-soft'}
                    `}>
                        {String(index + 1).padStart(2, '0')}
                    </span>
                )}

                {/* Title */}
                <span className={`
                    text-xs flex-1 truncate
                    ${isActive ? 'font-semibold' : 'font-semibold'}
                `}>
                    {entry.title}
                </span>

                {/* Keyboard Shortcut */}
                {enhanced && entry.keyboardShortcut && (
                    <span className={`text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white/40' : 'text-text-soft'}`}>
                        {entry.keyboardShortcut}
                    </span>
                )}

                {/* Active Indicator */}
                <ChevronRight
                    size={14}
                    className={`
                        flex-shrink-0 transition-all duration-300
                        ${isActive ? 'opacity-100 text-zinc-500 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}
                    `}
                />
            </Button>
        </li>
    );
}
