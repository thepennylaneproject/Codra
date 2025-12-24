import React from 'react';
import { Github } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GitHubConnectProps {
    connected?: boolean;
    className?: string;
}

export const GitHubConnect: React.FC<GitHubConnectProps> = ({ connected, className }) => {
    const handleConnect = () => {
        // Redirect to our Netlify Function to start OAuth
        window.location.href = '/.netlify/functions/github-auth-start';
    };

    if (connected) {
        return (
            <button
                disabled
                className={cn(
                    "flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-sm font-medium transition-all",
                    className
                )}
            >
                <Github size={16} />
                Connected to GitHub
            </button>
        );
    }

    return (
        <button
            onClick={handleConnect}
            className={cn(
                "flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-bold uppercase tracking-widest shadow-lg shadow-zinc-900/10 dark:shadow-none",
                className
            )}
        >
            <Github size={16} />
            Connect GitHub
        </button>
    );
};
