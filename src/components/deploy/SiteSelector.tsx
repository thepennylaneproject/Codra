import { Site } from '@/lib/deploy/types';

interface SiteSelectorProps {
    sites: Site[];
    selectedSiteId: string | null;
    onSelect: (siteId: string) => void;
    loading?: boolean;
}

export function SiteSelector({ sites, selectedSiteId, onSelect, loading }: SiteSelectorProps) {
    if (loading) {
        return <div className="animate-pulse h-10 w-full bg-background-elevated rounded"></div>;
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Active Site
            </label>
            <select
                value={selectedSiteId || ''}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full bg-background-elevated border border-border-strong rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-text-accent transition-colors"
            >
                <option value="" disabled>Select a site...</option>
                {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                        {site.name} ({site.provider})
                    </option>
                ))}
            </select>
            {selectedSiteId && (
                <a
                    href={sites.find(s => s.id === selectedSiteId)?.adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-accent hover:underline flex items-center gap-1"
                >
                    View in Provider Dashboard ↗
                </a>
            )}
        </div>
    );
}
