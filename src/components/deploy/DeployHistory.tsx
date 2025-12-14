import { Deploy } from '@/lib/deploy/types';

interface DeployHistoryProps {
    deploys: Deploy[];
    loading?: boolean;
}

export function DeployHistory({ deploys, loading }: DeployHistoryProps) {
    if (loading) {
        return <div className="text-center py-4 text-text-muted">Loading history...</div>;
    }

    if (deploys.length === 0) {
        return <div className="text-center py-4 text-text-muted">No deploy history found.</div>;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Recent Deploys</h3>
            <div className="space-y-2">
                {deploys.slice(0, 5).map((deploy) => (
                    <div
                        key={deploy.id}
                        className="flex items-center justify-between p-3 bg-background-elevated border border-border-subtle rounded-lg hover:border-border-strong transition-colors"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <StatusBadge state={deploy.state} />
                                <span className="text-xs text-text-muted font-mono">{deploy.context}</span>
                            </div>
                            <span className="text-sm text-text-primary font-medium mt-1">
                                {deploy.commitMessage || 'No commit message'}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-text-soft mt-1">
                                <span className="font-mono">{deploy.commitRef?.substring(0, 7)}</span>
                                <span>•</span>
                                <span>{new Date(deploy.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={deploy.deployUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-text-accent hover:underline px-2 py-1 rounded bg-background-subtle border border-border-subtle"
                            >
                                Vist
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ state }: { state: string }) {
    const styles: Record<string, string> = {
        ready: 'bg-green-900/30 text-green-400 border-green-800',
        building: 'bg-yellow-900/30 text-yellow-400 border-yellow-800 animate-pulse',
        error: 'bg-red-900/30 text-red-400 border-red-800',
        queued: 'bg-gray-800 text-gray-400 border-gray-700',
        canceled: 'bg-gray-800 text-gray-500 border-gray-700',
    };

    const defaultStyle = 'bg-gray-800 text-gray-400 border-gray-700';

    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${styles[state] || defaultStyle}`}>
            {state}
        </span>
    );
}
