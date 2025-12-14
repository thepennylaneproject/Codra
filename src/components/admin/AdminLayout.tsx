
import React from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    Activity,
    LogOut,
    Shield
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePage, onNavigate }) => {

    const navItems = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
        { id: 'providers', label: 'AI Providers', icon: <Activity className="w-5 h-5" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-background-default text-text-primary flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border-subtle bg-background-subtle/30 flex flex-col fixed h-full">
                <div className="p-6 border-b border-border-subtle flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Codra</h1>
                        <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Admin Panel</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === item.id
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-text-soft hover:text-text-primary hover:bg-zinc-800/50'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border-subtle">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-5 h-5" />
                        Exit Admin
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
};
