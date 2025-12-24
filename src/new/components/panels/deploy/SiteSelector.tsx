import { Site } from '../../../../lib/deploy/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ExternalLink, Server } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SiteSelectorProps {
    sites: Site[];
    selectedSiteId: string | null;
    onSelect: (siteId: string) => void;
    loading?: boolean;
    className?: string;
}

export function SiteSelector({ sites, selectedSiteId, onSelect, loading, className }: SiteSelectorProps) {
    if (loading) {
        return <div className="animate-pulse h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg"></div>;
    }

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Server size={10} />
                Production Target
            </label>
            <div className="relative group">
                <select
                    value={selectedSiteId || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all appearance-none cursor-pointer pr-10"
                >
                    <option value="" disabled>Select a production site...</option>
                    {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                            {site.name} • {site.provider.charAt(0).toUpperCase() + site.provider.slice(1)}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {selectedSite && (
                <a
                    href={selectedSite.adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1.5 transition-colors uppercase tracking-widest"
                >
                    Provider Dashboard
                    <ExternalLink size={10} />
                </a>
            )}
        </div>
    );
}
