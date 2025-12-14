import React from 'react';
import { Search, Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const TopBar: React.FC = () => {
    const location = useLocation();

    // Simple breadcrumb logic based on path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.length > 0
        ? pathSegments.map(s => s.charAt(0).toUpperCase() + s.slice(1))
        : ['Overview'];

    return (
        <header className="h-16 border-b border-border-subtle bg-background-default/95 backdrop-blur supports-[backdrop-filter]:bg-background-default/60 flex items-center justify-between px-6 sticky top-0 z-10">
            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="hover:text-text-primary cursor-pointer transition-colors">Codra</span>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                        <ChevronRight className="w-4 h-4 text-border-strong" />
                        <span className={`font-medium ${index === breadcrumbs.length - 1 ? 'text-text-primary' : 'hover:text-text-primary cursor-pointer transition-colors'}`}>
                            {crumb}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Search Trigger */}
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-subtle border border-border-subtle text-text-muted text-sm hover:border-border-strong hover:text-text-primary transition-all w-64 group">
                    <Search className="w-4 h-4 group-hover:text-brand-teal transition-colors" />
                    <span className="flex-1 text-left">Search...</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold border border-border-strong rounded bg-background-elevated text-text-muted font-mono">⌘K</kbd>
                </button>

                <div className="w-px h-6 bg-border-subtle mx-1" />

                <button className="p-2 rounded-full hover:bg-background-subtle text-text-muted hover:text-text-primary transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-magenta" />
                </button>
                <button className="p-2 rounded-full hover:bg-background-subtle text-text-muted hover:text-text-primary transition-colors">
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};
