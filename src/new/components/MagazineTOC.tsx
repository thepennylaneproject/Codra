/**
 * MAGAZINE TOC
 * Late 90s / Early 2000s Magazine-Style Table of Contents
 * 
 * Design Inspiration:
 * - Clean, high-contrast editorial layouts
 * - Monospace numbering like magazine page indices
 * - Condensed sans-serif headers
 * - Subtle separator lines
 * - Minimal color palette with bold accent on active
 */

import { useEffect, useCallback } from 'react';
import { SpreadTask, TaskStatus } from '../../domain/task-queue';
import { TOCEntry, EnhancedTOCEntry, ProductionDeskId, PRODUCTION_DESKS } from '../../domain/types';
import { Button } from '@/components/ui/Button';
import {
    Circle,
    CheckCircle2,
    Clock,
    AlertCircle,
    PlayCircle,
} from 'lucide-react';

// ============================================
// Styles - Late 90s Magazine Aesthetic
// ============================================

const styles = {
    // Container
    container: `
        h-full flex flex-col
        bg-zinc-50
        border-r border-zinc-200
        font-sans
    `,

    // Masthead - Magazine title block
    masthead: `
        px-4 py-4
        border-b border-zinc-300
    `,
    mastheadTitle: `
        text-xs font-semibold
        text-zinc-400
        mb-1
    `,
    mastheadIssue: `
        text-sm font-semibold text-zinc-800
        tracking-tight
    `,

    // Section header
    sectionHeader: `
        px-4 py-2
        border-b border-zinc-200
        bg-zinc-100
    `,
    sectionTitle: `
        text-xs font-semibold
        text-zinc-500
    `,

    // Entry list
    entryList: `
        flex-1 overflow-y-auto
    `,

    // Individual entry
    entry: `
        relative
        flex items-baseline gap-3
        px-4 py-3
        border-b border-zinc-100
        cursor-pointer
        transition-colors duration-100
        group
    `,
    entryHover: `
        hover:bg-zinc-100
    `,
    entryActive: `
        bg-zinc-900 text-white
        hover:bg-zinc-900
    `,

    // Entry number - Monospace page number style
    entryNumber: `
        font-mono text-xs font-medium
        w-6 flex-shrink-0
        text-zinc-400
    `,
    entryNumberActive: `
        text-zinc-400
    `,

    // Entry title
    entryTitle: `
        text-sm font-medium
        text-zinc-700
        flex-1
        leading-snug
    `,
    entryTitleActive: `
        text-white
    `,

    // Entry subtitle/description
    entrySub: `
        text-xs
        text-zinc-400
        leading-tight
        mt-0
    `,
    entrySubActive: `
        text-zinc-400
    `,

    // Status indicator
    statusIcon: `
        flex-shrink-0
        w-4 h-4
    `,

    // Footer
    footer: `
        px-4 py-3
        border-t border-zinc-300
        bg-zinc-100
    `,
    footerText: `
        text-xs font-medium
        text-zinc-400
    `,
    footerProgress: `
        h-1 bg-zinc-200 rounded-full mt-2
        overflow-hidden
    `,
    footerProgressBar: `
        h-full bg-zinc-700
        transition-all duration-300
    `,

    // Desk label
    deskLabel: `
        text-xs font-medium
        px-1 py-0
        rounded
        bg-zinc-200
        text-zinc-500
    `,
};

// ============================================
// Status Icons
// ============================================

const STATUS_ICONS: Record<TaskStatus, typeof Circle> = {
    pending: Circle,
    ready: PlayCircle,
    'in-progress': Clock,
    complete: CheckCircle2,
    blocked: AlertCircle,
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    pending: 'text-zinc-300',
    ready: 'text-emerald-500',
    'in-progress': 'text-amber-500',
    complete: 'text-emerald-600',
    blocked: 'text-rose-400',
};

// ============================================
// Types
// ============================================

interface MagazineTOCProps {
    // Either tasks or entries - tasks take priority
    tasks?: SpreadTask[];
    entries?: (TOCEntry | EnhancedTOCEntry)[];

    // State
    activeId: string | null;

    // Callbacks
    onSelect: (id: string) => void;
    onTaskSelect?: (task: SpreadTask) => void;

    // Options
    projectName?: string;
    enableKeyboard?: boolean;
}

// ============================================
// Component
// ============================================

export function MagazineTOC({
    tasks,
    entries,
    activeId,
    onSelect,
    onTaskSelect,
    projectName = 'Untitled',
    enableKeyboard = true,
}: MagazineTOCProps) {
    // Use tasks if provided, otherwise fall back to entries
    const items = tasks || entries || [];
    const isTaskMode = !!tasks && tasks.length > 0;

    // Calculate progress for task mode
    const progress = isTaskMode && tasks
        ? Math.round((tasks.filter(t => t.status === 'complete').length / tasks.length) * 100)
        : 0;

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enableKeyboard) return;

        // Number keys 1-9 for quick navigation
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
            const item = items[num - 1];
            if (item) {
                const id = 'id' in item ? item.id : (item as TOCEntry).sectionId;
                onSelect(id);

                if (isTaskMode && onTaskSelect && tasks) {
                    const task = tasks.find(t => t.id === id);
                    if (task) onTaskSelect(task);
                }
            }
        }
    }, [items, onSelect, onTaskSelect, enableKeyboard, isTaskMode, tasks]);

    useEffect(() => {
        if (enableKeyboard) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown, enableKeyboard]);

    // Group tasks by desk if in task mode
    const groupedByDesk = isTaskMode && tasks
        ? groupTasksByDesk(tasks)
        : null;

    return (
        <div className={styles.container}>
            {/* Masthead */}
            <div className={styles.masthead}>
                <div className={styles.mastheadTitle}>Contents</div>
                <div className={styles.mastheadIssue}>{projectName}</div>
            </div>

            {/* Entry List */}
            <nav className={`${styles.entryList} custom-scrollbar`}>
                {groupedByDesk ? (
                    // Task mode - grouped by desk
                    Array.from(groupedByDesk.entries()).map(([deskId, deskTasks]) => {
                        const desk = PRODUCTION_DESKS.find(d => d.id === deskId);

                        return (
                            <div key={deskId}>
                                {/* Desk Header */}
                                <div className={styles.sectionHeader}>
                                    <span className={styles.sectionTitle}>
                                        {desk?.label || deskId}
                                    </span>
                                </div>

                                {/* Desk Tasks */}
                                {deskTasks.map((task, idx) => (
                                    <TaskEntry
                                        key={task.id}
                                        task={task}
                                        index={idx + 1}
                                        isActive={task.id === activeId}
                                        onSelect={() => {
                                            onSelect(task.id);
                                            onTaskSelect?.(task);
                                        }}
                                    />
                                ))}
                            </div>
                        );
                    })
                ) : entries ? (
                    // Section mode - flat list
                    entries.map((entry, idx) => (
                        <SectionEntry
                            key={entry.id}
                            entry={entry}
                            index={idx + 1}
                            isActive={entry.sectionId === activeId}
                            onSelect={() => onSelect(entry.sectionId)}
                        />
                    ))
                ) : (
                    <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                        No items yet
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className={styles.footer}>
                <div className={styles.footerText}>
                    {isTaskMode
                        ? `${items.length} tasks · ${progress}% complete`
                        : `${items.length} sections`
                    }
                </div>
                {isTaskMode && (
                    <div className={styles.footerProgress}>
                        <div
                            className={styles.footerProgressBar}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// Task Entry Component
// ============================================

interface TaskEntryProps {
    task: SpreadTask;
    index: number;
    isActive: boolean;
    onSelect: () => void;
}

function TaskEntry({ task, index, isActive, onSelect }: TaskEntryProps) {
    const StatusIcon = STATUS_ICONS[task.status];
    const statusColor = STATUS_COLORS[task.status];

    return (
        <Button
            onClick={onSelect}
            className={`
                ${styles.entry}
                ${isActive ? styles.entryActive : styles.entryHover}
                w-full text-left
            `}
        >
            {/* Order Number */}
            <span className={`
                ${styles.entryNumber}
                ${isActive ? styles.entryNumberActive : ''}
            `}>
                {String(index).padStart(2, '0')}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={`
                    ${styles.entryTitle}
                    ${isActive ? styles.entryTitleActive : ''}
                    truncate
                `}>
                    {task.title}
                </div>
                {task.description && (
                    <div className={`
                        ${styles.entrySub}
                        ${isActive ? styles.entrySubActive : ''}
                        truncate
                    `}>
                        {task.description}
                    </div>
                )}
            </div>

            {/* Status */}
            <StatusIcon
                size={14}
                className={`${styles.statusIcon} ${statusColor}`}
            />
        </Button>
    );
}

// ============================================
// Section Entry Component
// ============================================

interface SectionEntryProps {
    entry: TOCEntry | EnhancedTOCEntry;
    index: number;
    isActive: boolean;
    onSelect: () => void;
}

function SectionEntry({ entry, index, isActive, onSelect }: SectionEntryProps) {
    const isEnhanced = 'status' in entry;
    const status = isEnhanced ? (entry as EnhancedTOCEntry).status : undefined;

    const StatusIcon = status ? STATUS_ICONS[status as keyof typeof STATUS_ICONS] : null;
    const statusColor = status ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : '';

    return (
        <Button
            onClick={onSelect}
            className={`
                ${styles.entry}
                ${isActive ? styles.entryActive : styles.entryHover}
                w-full text-left
            `}
        >
            {/* Order Number */}
            <span className={`
                ${styles.entryNumber}
                ${isActive ? styles.entryNumberActive : ''}
            `}>
                {String(index).padStart(2, '0')}
            </span>

            {/* Title */}
            <span className={`
                ${styles.entryTitle}
                ${isActive ? styles.entryTitleActive : ''}
                truncate flex-1
            `}>
                {entry.title}
            </span>

            {/* Status if enhanced */}
            {StatusIcon && (
                <StatusIcon
                    size={14}
                    className={`${styles.statusIcon} ${statusColor}`}
                />
            )}
        </Button>
    );
}

// ============================================
// Helper Functions
// ============================================

function groupTasksByDesk(tasks: SpreadTask[]): Map<ProductionDeskId, SpreadTask[]> {
    const groups = new Map<ProductionDeskId, SpreadTask[]>();

    for (const task of tasks) {
        const existing = groups.get(task.deskId) || [];
        groups.set(task.deskId, [...existing, task]);
    }

    return groups;
}
