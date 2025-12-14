/**
 * RAIL ITEM
 * Individual navigation item with Cosmic Cockpit styling
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { RailTooltip } from './RailTooltip';
import { cn } from '../../lib/utils';

interface RailItemProps {
    label: string;
    path: string;
    icon: LucideIcon;
    shortcut?: string;
    isExpanded: boolean;
    index?: number;
}

export const RailItem: React.FC<RailItemProps> = ({
    label,
    path,
    icon: Icon,
    shortcut,
    isExpanded
}) => {
    const location = useLocation();
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    const content = (
        <NavLink
            to={path}
            className={cn(
                "relative group flex items-center gap-3 rounded-xl transition-all duration-200 min-h-[40px]",
                isExpanded ? "px-3 py-2 w-full" : "justify-center w-10 h-10 mx-auto",
                isActive
                    ? "bg-energy-teal/[0.12] text-energy-teal"
                    : "text-stardust-muted hover:text-stardust hover:bg-white/[0.04]"
            )}
        >
            {/* Active indicator glow */}
            {isActive && (
                <div className="absolute inset-0 rounded-xl bg-energy-teal/10 blur-sm pointer-events-none" />
            )}

            {/* Icon with glow when active */}
            <div className="relative">
                <Icon
                    className={cn(
                        "shrink-0 w-5 h-5 transition-colors relative z-10",
                        isActive ? "text-energy-teal" : "text-stardust-muted group-hover:text-stardust"
                    )}
                />
                {isActive && (
                    <div className="absolute inset-0 bg-energy-teal/50 blur-md pointer-events-none" />
                )}
            </div>

            {isExpanded && (
                <span className="text-sm font-medium truncate flex-1 relative z-10 animate-in fade-in slide-in-from-left-2 duration-200">
                    {label}
                </span>
            )}

            {isExpanded && shortcut && (
                <span className="hidden group-hover:block ml-auto text-xs text-stardust-dim font-mono relative z-10">
                    {shortcut}
                </span>
            )}
        </NavLink>
    );

    // If collapsed, wrap in tooltip
    if (!isExpanded) {
        return (
            <RailTooltip content={label} shortcut={shortcut} side="right">
                {content}
            </RailTooltip>
        );
    }

    return content;
};
