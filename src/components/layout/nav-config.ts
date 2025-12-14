import {
    LayoutDashboard,
    Layers,
    Cpu,
    Zap,
    Library,
    Settings
} from 'lucide-react';

export const MAIN_NAV_ITEMS = [
    { label: 'Overview', path: '/', icon: LayoutDashboard, shortcut: 'O' },
    { label: 'Projects', path: '/projects', icon: Layers, shortcut: 'P' },
    { label: 'Studio', path: '/studio', icon: Cpu, shortcut: 'S' },
    { label: 'AI Playground', path: '/ai', icon: Zap, shortcut: 'A' },

    { label: 'Prompts', path: '/prompts', icon: Library, shortcut: 'L' },
    { label: 'Assets', path: '/assets', icon: Library, shortcut: 'E' },
];

export const BOTTOM_NAV_ITEMS = [
    { label: 'Settings', path: '/settings', icon: Settings, shortcut: ',' },
];
