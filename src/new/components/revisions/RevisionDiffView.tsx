/**
 * REVISION DIFF VIEW
 * src/new/components/revisions/RevisionDiffView.tsx
 * 
 * Visualization component for editorial diffs.
 */

import { Plus, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DiffTextProps {
    oldValue?: string;
    newValue?: string;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    className?: string;
}

export function DiffText({ oldValue, newValue, type, className }: DiffTextProps) {
    if (type === 'unchanged') return <span className={className}>{newValue}</span>;

    if (type === 'added') {
        return (
            <span className={cn("bg-emerald-50 text-emerald-800 font-black px-1.5 py-0.5 rounded-sm ring-1 ring-emerald-200/50 shadow-sm", className)}>
                {newValue}
            </span>
        );
    }

    if (type === 'removed') {
        return (
            <span className={cn("bg-rose-50 text-rose-800 line-through decoration-rose-400/50 decoration-2 px-1.5 py-0.5 rounded-sm opacity-60", className)}>
                {oldValue}
            </span>
        );
    }

    // modified
    return (
        <span className={cn("inline-flex flex-wrap gap-2 items-baseline", className)}>
            <span className="bg-rose-50 text-rose-800 line-through decoration-rose-400/50 decoration-2 px-1 py-0.5 rounded-sm opacity-40">{oldValue}</span>
            <span className="bg-emerald-50 text-emerald-800 font-black px-1 py-0.5 rounded-sm ring-1 ring-emerald-200/50">{newValue}</span>
        </span>
    );
}

interface DiffListProps {
    oldItems: string[];
    newItems: string[];
    className?: string;
}

export function DiffList({ oldItems, newItems, className }: DiffListProps) {
    const added = newItems.filter(i => !oldItems.includes(i));
    const removed = oldItems.filter(i => !newItems.includes(i));
    const unchanged = newItems.filter(i => oldItems.includes(i));

    return (
        <ul className={cn("space-y-2", className)}>
            {unchanged.map((item, idx) => (
                <li key={`u-${idx}`} className="flex gap-4 text-sm text-zinc-600 leading-relaxed font-serif">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-2 shrink-0" />
                    <span>{item}</span>
                </li>
            ))}
            {added.map((item, idx) => (
                <li key={`a-${idx}`} className="flex gap-4 text-sm text-emerald-900 font-black leading-relaxed bg-emerald-50/30 p-2 rounded-lg ring-1 ring-emerald-100 shadow-sm font-serif">
                    <Plus size={12} className="mt-1.5 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                </li>
            ))}
            {removed.map((item, idx) => (
                <li key={`r-${idx}`} className="flex gap-4 text-sm text-rose-900 line-through decoration-rose-300/50 decoration-2 opacity-50 leading-relaxed bg-rose-50/20 p-2 rounded-lg font-serif">
                    <Minus size={12} className="mt-1.5 shrink-0 text-rose-400" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}
