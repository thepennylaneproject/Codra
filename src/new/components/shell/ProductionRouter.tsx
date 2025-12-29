import React from 'react';
import { Link, useParams } from 'react-router-dom';
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
        <nav className="flex items-center gap-1.5 px-4 py-2 bg-white/40 backdrop-blur-sm border-b border-[#1A1A1A]/5">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8A8A] mr-2 pl-2">
                Task Workspaces
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
                                    ? "bg-[#1A1A1A] text-white shadow-md shadow-[#1A1A1A]/10" 
                                    : "text-[#5A5A5A] hover:bg-[#1A1A1A]/5 hover:text-[#1A1A1A]"
                            )}
                        >
                            <Icon 
                                size={14} 
                                strokeWidth={isActive ? 2 : 1.5} 
                                className={cn(
                                    "transition-transform group-hover:scale-110",
                                    isActive ? "text-[var(--brand-teal)]" : "text-[#8A8A8A]"
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
