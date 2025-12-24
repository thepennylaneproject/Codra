import { Deploy } from '../../../../lib/deploy/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ExternalLink, Clock, GitCommit } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DeployHistoryProps {
    deploys: Deploy[];
    loading?: boolean;
    className?: string;
}

export function DeployHistory({ deploys, loading, className }: DeployHistoryProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 w-full bg-zinc-50 dark:bg-zinc-900 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (deploys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Clock className="text-zinc-300" size={32} />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-400">No Deploy History</p>
                    <p className="text-xs text-zinc-500">Your production activity will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            <header className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Recent Activity
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 rounded">
                    {deploys.length} Events
                </span>
            </header>

            <div className="space-y-3">
                {deploys.slice(0, 5).map((deploy) => (
                    <div
                        key={deploy.id}
                        className="group flex flex-col p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md hover:shadow-zinc-900/5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <StatusBadge state={deploy.state} />
                                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                    {deploy.context}
                                </span>
                            </div>
                            <a
                                href={deploy.deployUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ExternalLink size={14} />
                            </a>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm text-zinc-900 dark:text-zinc-100 font-bold leading-tight line-clamp-2">
                                {deploy.commitMessage || 'Automated Production Release'}
                            </span>

                            <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1 text-zinc-500">
                                    <GitCommit size={10} />
                                    {deploy.commitRef?.substring(0, 7) || 'N/A'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                <span>{new Date(deploy.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ state }: { state: string }) {
    const styles: Record<string, string> = {
        ready: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
        building: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50 animate-pulse',
        error: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50',
        queued: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700',
        canceled: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700',
    };

    const defaultStyle = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700';

    return (
        <span className={cn(
            "text-[9px] uppercase font-black px-2 py-0.5 rounded border tracking-[0.1em]",
            styles[state] || defaultStyle
        )}>
            {state}
        </span>
    );
}
