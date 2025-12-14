
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Palette,
    BarChart2,
    Rocket,
    Home,
    Folder,
    Cpu,
    Zap,
    Settings,
    Key,
    CreditCard,
    Sparkles,
    LucideIcon
} from 'lucide-react';
import { useMemo } from 'react';
import { useProjectStore } from '../../lib/store/project-store';
import { usePromptArchitectStore } from '../../lib/prompt-architect';


export interface Command {
    id: string;
    label: string;
    icon: LucideIcon;
    shortcut?: string;
    group: 'actions' | 'navigation' | 'recent' | 'settings';
    action: () => void;
    keywords?: string[];
    metadata?: string; // For timestamp or other info
}

export const useCommands = (search: string) => {
    const navigate = useNavigate();
    const projects = useProjectStore(state => state.projects);
    const togglePromptArchitect = usePromptArchitectStore(state => state.toggle);

    const commands: Command[] = useMemo(() => {
        const baseCommands: Command[] = [
            // Actions
            {
                id: 'open-prompt-architect',
                label: 'Open Prompt Architect',
                icon: Sparkles,
                shortcut: '⌘⇧P',
                group: 'actions',
                action: () => togglePromptArchitect(),
                keywords: ['prompt', 'generate', 'ai', 'architect', 'intent']
            },
            {
                id: 'new-project',
                label: 'New Project',
                icon: Plus,
                shortcut: '⌘N',
                group: 'actions',
                action: () => navigate('/projects/new'),
                keywords: ['create', 'add']
            },
            {
                id: 'open-design',
                label: 'Open Design Console',
                icon: Palette,
                shortcut: '⌘D',
                group: 'actions',
                action: () => navigate('/studio/design'),
                keywords: ['ui', 'theme', 'color']
            },
            {
                id: 'benchmark',
                label: 'Run Benchmark',
                icon: BarChart2,
                shortcut: '⌘B',
                group: 'actions',
                action: () => console.log('Benchmark trigger'),
                keywords: ['test', 'performance', 'speed']
            },
            {
                id: 'deploy',
                label: 'Deploy Project',
                icon: Rocket,
                shortcut: '⌘⇧D',
                group: 'actions',
                action: () => console.log('Deploy trigger'),
                keywords: ['publish', 'release', 'ship']
            },

            // Navigation
            {
                id: 'nav-dashboard',
                label: 'Go to Dashboard',
                icon: Home,
                shortcut: '⌘1',
                group: 'navigation',
                action: () => navigate('/'),
                keywords: ['home', 'main']
            },
            {
                id: 'nav-projects',
                label: 'Go to Projects',
                icon: Folder,
                shortcut: '⌘2',
                group: 'navigation',
                action: () => navigate('/projects'),
                keywords: ['list', 'directory']
            },
            {
                id: 'nav-studio',
                label: 'Go to Studio',
                icon: Cpu,
                shortcut: '⌘3',
                group: 'navigation',
                action: () => navigate('/studio'),
                keywords: ['editor', 'code']
            },
            {
                id: 'nav-playground',
                label: 'Go to AI Playground',
                icon: Zap,
                shortcut: '⌘4',
                group: 'navigation',
                action: () => navigate('/ai'),
                keywords: ['chat', 'bot', 'prompt']
            },

            // Settings - These might be moved to bottom in UI visualization via grouping order
            // But we keep them here in the main list
        ];

        // Map projects to commands
        const projectCommands: Command[] = Object.values(projects)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5) // Top 5 recent
            .map(project => ({
                id: `project-${project.id}`,
                label: project.title,
                icon: Folder,
                group: 'recent',
                action: () => navigate(`/projects/${project.id}`),
                keywords: [project.title, 'project', 'recent'],
                metadata: 'Recently opened' // We could format relative time here
            }));

        const settingCommands: Command[] = [
            {
                id: 'settings',
                label: 'Open Settings',
                icon: Settings,
                shortcut: '⌘,',
                group: 'settings',
                action: () => navigate('/settings'),
                keywords: ['config', 'preferences']
            },
            {
                id: 'credentials',
                label: 'Manage API Keys',
                icon: Key,
                group: 'settings',
                action: () => navigate('/settings/credentials'),
                keywords: ['auth', 'token', 'secret']
            },
            {
                id: 'billing',
                label: 'Billing & Usage',
                icon: CreditCard,
                group: 'settings',
                action: () => navigate('/settings/billing'),
                keywords: ['payment', 'subscription', 'plan']
            },
        ];

        return [...baseCommands, ...projectCommands, ...settingCommands];
    }, [navigate, projects, togglePromptArchitect]);

    const filteredCommands = useMemo(() => {
        if (!search.trim()) return commands;

        const lowerSearch = search.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lowerSearch) ||
            cmd.keywords?.some(k => k.toLowerCase().includes(lowerSearch)) ||
            cmd.group.toLowerCase().includes(lowerSearch)
        );
    }, [search, commands]);

    return { commands: filteredCommands };
};
