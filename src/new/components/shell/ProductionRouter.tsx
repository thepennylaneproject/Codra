import React from 'react';
import { Link } from 'react-router-dom';
import { 
    PRODUCTION_DESKS, 
    ProductionDeskId 
} from '../../../domain/types';
import { 
    Box, 
    Code, 
    FileText, 
    LayoutTemplate, 
    Megaphone, 
    Briefcase, 
    LineChart,
    LucideIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const DESK_ICONS: Record<ProductionDeskId, LucideIcon> = {
    'art-design': Box,
    'engineering': Code,
    'writing': FileText,
    'workflow': LayoutTemplate,
    'marketing': Megaphone,
    'career-assets': Briefcase,
    'data-analysis': LineChart,
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
        <nav className="flex items-center gap-1.5 px-4 py-2 bg-white/40 backdrop-blur-sm border-b border-[var(--color-border-soft)]">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mr-2 pl-2">
                Studios
            </div>
            
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {PRODUCTION_DESKS.map((desk) => {
                    const Icon = DESK_ICONS[desk.id] || Box;
                    const isActive = activeDeskId === desk.id;
                    
                    return (
                        <Link
                            key={desk.id}
                            to={`/p/${projectId}/desk/${desk.id}`}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap group",
                                isActive 
                                    ? "bg-[var(--color-ink)] text-white shadow-md shadow-[var(--color-ink)]/10" 
                                    : "text-[var(--color-ink-light)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink)]"
                            )}
                        >
                            <Icon 
                                size={14} 
                                strokeWidth={isActive ? 2 : 1.5} 
                                className={cn(
                                    "transition-transform group-hover:scale-110",
                                    isActive ? "text-[var(--brand-teal)]" : "text-[var(--color-ink-muted)]"
                                )} 
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {desk.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
