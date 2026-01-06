import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getProjects } from '../../domain/projects';
import { Project } from '../../domain/types';
import { useToast } from '../components/Toast';

/**
 * PROJECTS PAGE
 * Architectural project registry.
 */
type ProjectStatus = 'Idle' | 'Running' | 'Complete';

export function ProjectsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            if (isFetching) return;
            setIsFetching(true);
            try {
                const data = await getProjects();
                setProjects(data);
            } finally {
                setLoading(false);
                setIsFetching(false);
            }
        };
        fetchProjects();
    }, []);


    const statusMap = useMemo(() => {
        const next = new Map<string, ProjectStatus>();
        if (typeof window === 'undefined') return next;

        for (const project of projects) {
            const taskQueueKey = `codra:taskQueue:${project.id}`;
            const stored = localStorage.getItem(taskQueueKey);
            if (!stored) {
                next.set(project.id, 'Idle');
                continue;
            }
            try {
                const parsed = JSON.parse(stored);
                const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
                const hasRunning = tasks.some((task: { status?: string }) => task.status === 'in-progress');
                const hasComplete = tasks.some((task: { status?: string }) => task.status === 'complete');
                if (hasRunning) {
                    next.set(project.id, 'Running');
                } else if (hasComplete) {
                    next.set(project.id, 'Complete');
                } else {
                    next.set(project.id, 'Idle');
                }
            } catch {
                next.set(project.id, 'Idle');
            }
        }
        return next;
    }, [projects]);

    const displayProjects = projects;

    return (
        <div className="min-h-screen flex flex-col bg-[#FFFAF0] text-[#1A1A1A]">
            {/* Header */}
            <header className="border-b border-[#1A1A1A]/15 px-8 py-8">
                <h1 className="font-semibold tracking-tight text-[#1A1A1A]" style={{ fontSize: '24px' }}>Projects</h1>
            </header>

            {/* Content */}
            <main className="flex-1 px-8 py-8">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-[#1A1A1A]/5" />
                        ))}
                    </div>
                ) : displayProjects.length > 0 ? (
                    <div className="space-y-px">
                        {displayProjects.map((project) => {
                            const status = statusMap.get(project.id) ?? 'Idle';
                            const updatedAt = new Date(project.updatedAt).toLocaleString();
                            return (
                                <div key={project.id} className="flex items-center justify-between gap-8 py-3 border-b border-[#1A1A1A]/15 last:border-b-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-normal text-[#1A1A1A] truncate" style={{ fontSize: '14px' }}>{project.name}</div>
                                        <div className="font-normal text-[#1A1A1A] opacity-35 mt-1" style={{ fontSize: '11px' }}>{updatedAt}</div>
                                    </div>
                                    <div className="font-normal text-[#1A1A1A] opacity-35" style={{ fontSize: '11px' }}>{status}</div>
                                    <button
                                        onClick={() => navigate(`/p/${project.id}/workspace`)}
                                        className="font-normal text-[#1A1A1A] border border-[#1A1A1A]/15 px-3 py-1.5"
                                        style={{ fontSize: '14px' }}
                                    >
                                        Open
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12">
                        <p className="font-normal text-[#1A1A1A] opacity-35" style={{ fontSize: '11px' }}>No projects.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-[#1A1A1A]/15 px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-6 text-[#1A1A1A] opacity-20" style={{ fontSize: '11px' }}>
                <span>© 2025 Codra</span>
                <div className="flex items-center gap-6">
                    <Link to="/terms" className="hover:opacity-40">Terms</Link>
                    <Link to="/privacy" className="hover:opacity-40">Privacy</Link>
                </div>
            </footer>
        </div>
    );
}

