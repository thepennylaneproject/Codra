import React, { useEffect, useState } from 'react';
import { GitHubConnect } from './GitHubConnect';
import { RepoSelector } from './RepoSelector';
import { gitHubAdapter, Repository } from '../../../../lib/git/github';
import { Github, Globe, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const GitPanel: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    useEffect(() => {
        // Check for token in URL query params if redirected from callback
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');

        if (tokenParam) {
            setToken(tokenParam);
            gitHubAdapter.initialize(tokenParam);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Check localStorage
            const savedToken = localStorage.getItem('github_token');
            if (savedToken) {
                setToken(savedToken);
                gitHubAdapter.initialize(savedToken);
            }
        }
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem('github_token', token);
        }
    }, [token]);

    const handleRepoSelect = (repo: Repository) => {
        setSelectedRepo(repo);
        console.log("Selected repo:", repo);
    };

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-8 bg-zinc-50 dark:bg-zinc-950">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                    <Github size={32} className="text-zinc-900 dark:text-zinc-100" />
                </div>
                <div className="space-y-3 max-w-sm">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tighter">
                        Version Control
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                        Connect your GitHub account to bridge your editorial workflow with production repositories.
                    </p>
                </div>
                <GitHubConnect />
            </div>
        );
    }

    if (selectedRepo) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
                <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <Github size={18} className="text-zinc-900 dark:text-zinc-100" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{selectedRepo.name}</h2>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                <Globe size={10} />
                                <span>{selectedRepo.full_name}</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => setSelectedRepo(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-all"
                        leftIcon={<ChevronLeft size={12} />}
                    >
                        Switch
                    </Button>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300">
                        <Github size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Repository Active</p>
                        <p className="text-xs text-zinc-500 font-medium">Full file explorer integration is pending initialization.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-zinc-950 flex flex-col">
            <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h2 className="font-semibold text-xs text-zinc-400">
                    Repository
                </h2>
            </header>
            <RepoSelector onSelect={handleRepoSelect} />
        </div>
    );
};
