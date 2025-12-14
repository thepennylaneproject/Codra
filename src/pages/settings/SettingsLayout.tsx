
import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
    User,
    Palette,
    Key,
    CreditCard,
    Bell,
    Link as LinkIcon,
    Rocket,
    Cog
} from 'lucide-react';

export const SettingsLayout: React.FC = () => {
    const location = useLocation();

    const sections = [
        { id: 'profile', label: 'Profile', icon: User, path: '/settings/profile' },
        { id: 'appearance', label: 'Appearance', icon: Palette, path: '/settings/appearance' },
        { id: 'credentials', label: 'API Keys', icon: Key, path: '/settings/credentials' },
        { id: 'billing', label: 'Billing & Usage', icon: CreditCard, path: '/settings/billing' },
        { id: 'notifications', label: 'Notifications', icon: Bell, path: '/settings/notifications' },
        { id: 'integrations', label: 'Integrations', icon: LinkIcon, path: '/settings/integrations' },
        { id: 'deploy', label: 'Deployment', icon: Rocket, path: '/settings/deploy' },
        { id: 'advanced', label: 'Advanced', icon: Cog, path: '/settings/advanced' },
    ];

    // If we are at the root settings path, redirect to profile
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
        return <Navigate to="/settings/profile" replace />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-zinc-900/50 px-8 py-6">
                <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
                <p className="text-sm text-zinc-400 mt-1">Manage your account and preferences</p>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <nav className="w-56 flex-shrink-0">
                        <ul className="space-y-1">
                            {sections.map(section => (
                                <li key={section.id}>
                                    <NavLink
                                        to={section.path}
                                        className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                      ${isActive
                                                ? 'bg-teal-500/10 text-teal-400'
                                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                                            }
                    `}
                                    >
                                        <section.icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{section.label}</span>
                                        {/* {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />} */}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 bg-zinc-900/20 rounded-xl border border-zinc-800/50 p-6">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};
