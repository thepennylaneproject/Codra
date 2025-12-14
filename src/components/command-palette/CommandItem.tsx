
import React, { useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CommandItemProps {
    id: string;
    label: string;
    icon: LucideIcon;
    shortcut?: string;
    metadata?: string;
    isSelected: boolean;
    onSelect: () => void;
    onMouseEnter: () => void;
}

export const CommandItem: React.FC<CommandItemProps> = ({
    label,
    icon: Icon,
    shortcut,
    metadata,
    isSelected,
    onSelect,
    onMouseEnter,
}) => {
    const itemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isSelected && itemRef.current) {
            itemRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [isSelected]);

    return (
        <button
            ref={itemRef}
            onClick={onSelect}
            onMouseEnter={onMouseEnter}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 text-left outline-none rounded-md mx-2 my-0.5 w-[calc(100%-16px)]",
                isSelected
                    ? "bg-accent-primary/10 text-accent-primary shadow-sm shadow-accent-primary/5"
                    : "text-zinc-400 hover:text-zinc-200"
            )}
            role="option"
            aria-selected={isSelected}
        >
            <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-accent-primary" : "text-zinc-500")} />

            <span className="flex-1 font-medium truncate">{label}</span>

            <div className="flex items-center gap-3">
                {metadata && (
                    <span className="text-xs text-zinc-500 font-medium">
                        {metadata}
                    </span>
                )}
                {shortcut && (
                    <span className={cn(
                        "flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border",
                        isSelected
                            ? "bg-accent-primary/10 border-accent-primary/20 text-accent-primary"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
                    )}>
                        {shortcut}
                    </span>
                )}
            </div>
        </button>
    );
};
