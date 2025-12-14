import { Clock, ArrowRight, Folder, FileText, CheckSquare, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../lib/store/project-store';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: string;
    type: 'project' | 'task' | 'artifact';
    title: string;
    subtitle: string;
    updatedAt: Date;
    icon: React.ElementType;
    link: string;
}

export const RecentActivityPanel = () => {
    const navigate = useNavigate();
    const { projects, tasks, artifacts } = useProjectStore();

    // Aggregate all items into a unified list
    const activities: ActivityItem[] = [
        ...Object.values(projects).map(p => ({
            id: p.id,
            type: 'project' as const,
            title: p.title,
            subtitle: p.summary && p.summary.length > 50 ? `${p.summary.substring(0, 50)}...` : p.summary || 'No description',
            updatedAt: new Date(p.updatedAt),
            icon: Folder,
            link: `/projects/${p.id}`
        })),
        ...Object.values(tasks).map(t => {
            const project = projects[t.projectId];
            return {
                id: t.id,
                type: 'task' as const,
                title: t.title,
                subtitle: `Project: ${project?.title || 'Unknown'}`,
                updatedAt: new Date(t.updatedAt),
                icon: CheckSquare,
                link: `/projects/${t.projectId}` // Ideally link to specific task
            };
        }),
        ...Object.values(artifacts).map(a => {
            const project = projects[a.projectId];
            return {
                id: a.id,
                type: 'artifact' as const,
                title: a.name,
                subtitle: `Project: ${project?.title || 'Unknown'}`,
                updatedAt: new Date(a.updatedAt),
                icon: FileText,
                link: `/projects/${a.projectId}` // Ideally link to artifact viewer
            };
        })
    ];

    // Sort by most recent
    const sortedActivities = activities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);

    if (sortedActivities.length === 0) {
        return (
            <div className="rounded-xl border border-border-subtle bg-background-elevated p-8 text-center">
                <div className="w-12 h-12 bg-background-subtle rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-text-muted" />
                </div>
                <h3 className="text-text-primary font-medium mb-1">No recent activity</h3>
                <p className="text-text-muted text-sm">Start a new project to see activity here.</p>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h2 className="text-label-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-muted" />
                Recent Activity
            </h2>
            <div className="rounded-xl border border-border-subtle bg-background-elevated overflow-hidden">
                {sortedActivities.map((item) => (
                    <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => navigate(item.link)}
                        className="p-4 border-b border-border-subtle last:border-0 hover:bg-background-subtle/50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                ${item.type === 'project' ? 'bg-indigo-500/10 text-indigo-500' :
                                    item.type === 'task' ? 'bg-emerald-500/10 text-emerald-500' :
                                        'bg-amber-500/10 text-amber-500'
                                }`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-body-sm font-medium text-text-primary group-hover:text-brand-teal transition-colors">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                    <span>{item.subtitle}</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(item.updatedAt, { addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    );
};
