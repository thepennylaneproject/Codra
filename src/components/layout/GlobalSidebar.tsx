import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from './nav-config';
import { Activity, User } from 'lucide-react';

export const GlobalSidebar: React.FC = () => {
    const location = useLocation();

    const NavItem = ({ item }: { item: typeof MAIN_NAV_ITEMS[0] }) => {
        const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
        const Icon = item.icon;

        return (
            <NavLink
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                        ? 'bg-brand-teal/10 text-brand-teal'
                        : 'text-text-muted hover:text-text-primary hover:bg-background-subtle'
                    }`}
            >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-teal' : 'text-text-muted group-hover:text-text-primary'}`} />
                {item.label}
            </NavLink>
        );
    };

    return (
        <aside className="w-64 border-r border-border-subtle bg-background-elevated/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-border-subtle/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-blue flex items-center justify-center shadow-lg shadow-brand-teal/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display font-semibold text-lg text-text-primary tracking-tight">
                        Codra
                    </span>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Menu
                </div>
                {MAIN_NAV_ITEMS.map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}
            </div>

            {/* Bottom Section */}
            <div className="p-3 border-t border-border-subtle/50 space-y-1">
                {BOTTOM_NAV_ITEMS.map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}

                {/* User Profile Snippet (Mock) */}
                <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-lg border border-border-subtle bg-background-subtle/50 cursor-pointer hover:bg-background-subtle transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <User className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">User</div>
                        <div className="text-xs text-text-muted truncate">Free Plan</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
