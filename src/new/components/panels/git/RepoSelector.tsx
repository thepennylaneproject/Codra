import React, { useEffect, useState } from 'react';
import { gitHubAdapter, Repository } from '../../../../lib/git/github';
import { GitBranch, Lock, Search, Globe, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/Button';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface RepoSelectorProps {
    onSelect: (repo: Repository) => void;
    className?: string;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({ onSelect, className }) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadRepos();
    }, []);

    const loadRepos = async () => {
        if (!gitHubAdapter.isAuthenticated()) return;
        setLoading(true);
        try {
            const list = await gitHubAdapter.listRepos();
            setRepos(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(r =>
        r.full_name.toLowerCase().includes(filter.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-8 text-zinc-400 text-xs font-mono text-center animate-pulse">
                Fetching Repositories...
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-zinc-950", className)}>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all placeholder:text-zinc-400"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredRepos.map(repo => (
                    <Button
                        key={repo.id}
                        onClick={() => onSelect(repo)}
                        className="w-full text-left p-4 border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                    {repo.name}
                                </span>
                                {repo.private ? (
                                    <Lock size={10} className="text-zinc-400" />
                                ) : (
                                    <Globe size={10} className="text-zinc-400" />
                                )}
                            </div>
                            <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </div>

                        <p className="text-xs text-zinc-500 line-clamp-1 mb-3">
                            {repo.description || 'No description provided'}
                        </p>

                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                            <span className="flex items-center gap-1 text-zinc-500">
                                <GitBranch size={10} />
                                {repo.default_branch}
                            </span>
                            <span>Updated {new Date(repo.updated_at || '').toLocaleDateString()}</span>
                        </div>

                        {/* Hover accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 -translate-x-full group-hover:translate-x-0 transition-transform" />
                    </Button>
                ))}

                {filteredRepos.length === 0 && (
                    <div className="p-12 text-center space-y-2">
                        <div className="text-sm font-medium text-zinc-400">No repositories found</div>
                        <p className="text-xs text-zinc-500">Adjust search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
