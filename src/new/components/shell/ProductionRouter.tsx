import React from 'react';
import { Link } from 'react-router-dom';
import { 
    PRODUCTION_DESKS, 
    ProductionDeskId 
} from '../../../domain/types';
import { 
    Box,
    LucideIcon,
    PenLine,
    Palette,
    Code2,
    BarChart3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const DESK_ICONS: Record<ProductionDeskId, LucideIcon> = {
    'write': PenLine,
    'design': Palette,
    'code': Code2,
    'analyze': BarChart3,
};

interface ProductionRouterProps {
    activeDeskId?: string;
    projectId: string;
}

/**
 * PRODUCTION ROUTER
 * A prominent navigation bar for switching between task workspaces.
 * High-end editorial feel with ivory/ink aesthetics.
 */
export const ProductionRouter: React.FC<ProductionRouterProps> = ({ 
    activeDeskId, 
    projectId 
}) => {
    return (
        <nav className="flex items-center gap-1 px-4 py-2 glass-panel-light border-0 border-b border-[var(--ui-border-soft)] rounded-none bg-[var(--ui-bg)]/40">
            <div className="text-xs font-semibold text-text-soft mr-2 pl-2">
                Studio workspaces
            </div>
            
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {PRODUCTION_DESKS.map((desk) => {
                    const Icon = DESK_ICONS[desk.id] || Box;
                    const isActive = activeDeskId === desk.id;
                    
                    return (
                        <Link
                            key={desk.id}
                            to={`/p/${projectId}/production?desk=${desk.id}`}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded-lg transition-all whitespace-nowrap group",
                                isActive 
                                    ? "bg-[var(--ui-text)] text-background-default shadow-md shadow-[var(--ui-text)]/10" 
                                    : "text-text-soft hover:bg-[var(--ui-border-soft)] hover:text-text-primary"
                            )}
                        >
                            <Icon 
                                size={14} 
                                strokeWidth={isActive ? 2 : 1.5} 
                                className={cn(
                                    "transition-transform group-hover:scale-110",
                                    isActive ? "text-brand-teal" : "text-text-soft"
                                )} 
                            />
                            <span className="text-xs font-semibold">{desk.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
