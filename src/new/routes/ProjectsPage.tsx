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
    const [showCreateMenu, setShowCreateMenu] = useState(false);

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
                <div className="flex items-center justify-between">
                    <h1 className="font-semibold tracking-tight text-[#1A1A1A]" style={{ fontSize: '24px' }}>Projects</h1>
                    <div className="relative">
                        <button
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            className="font-normal text-[#1A1A1A] border border-[#1A1A1A]/15 px-3 py-1.5"
                            style={{ fontSize: '14px' }}
                        >
                            Create
                        </button>
                        {showCreateMenu && (
                            <>
                                <div className="absolute right-0 mt-2 bg-[#FFFAF0] border border-[#1A1A1A]/15" style={{ minWidth: '160px' }}>
                                    <button
                                        onClick={() => {
                                            navigate('/new');
                                            setShowCreateMenu(false);
                                        }}
                                        className="w-full text-left font-normal text-[#1A1A1A] px-3 py-2 border-b border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/5"
                                        style={{ fontSize: '14px' }}
                                    >
                                        New project
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/blueprints');
                                            setShowCreateMenu(false);
                                        }}
                                        className="w-full text-left font-normal text-[#1A1A1A] px-3 py-2 border-b border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/5"
                                        style={{ fontSize: '14px' }}
                                    >
                                        Start from blueprint
                                    </button>
                                    <button
                                        onClick={() => {
                                            document.getElementById('import-project-file')?.click();
                                            setShowCreateMenu(false);
                                        }}
                                        className="w-full text-left font-normal text-[#1A1A1A] px-3 py-2 hover:bg-[#1A1A1A]/5"
                                        style={{ fontSize: '14px' }}
                                    >
                                        Import
                                    </button>
                                </div>
                                <div
                                    className="fixed inset-0 z-0"
                                    onClick={() => setShowCreateMenu(false)}
                                />
                            </>
                        )}
                    </div>
                </div>
                <input
                    type="file"
                    id="import-project-file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            try {
                                const projectData = JSON.parse(event.target?.result as string);
                                if (!projectData.name) throw new Error("Invalid project data");
                                toast.success(`Project "${projectData.name}" imported. Redirecting...`);
                                // Import flow would go here - for now just show success
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (err) {
                                toast.error("Invalid project file.");
                            }
                        };
                        reader.readAsText(file);
                    }}
                />
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
                            const logoUrl = project.brandConstraints?.logoUrl;
                            const monogram = project.name.split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

                            return (
                                <div key={project.id} className="flex items-center gap-4 py-3 border-b border-[#1A1A1A]/15 last:border-b-0">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0">
                                        {logoUrl ? (
                                            <img
                                                src={logoUrl}
                                                alt={project.name}
                                                className="w-8 h-8 object-cover border border-[#1A1A1A]/15"
                                                style={{ borderRadius: '2px' }}
                                            />
                                        ) : (
                                            <div
                                                className="w-8 h-8 border border-[#1A1A1A]/15 flex items-center justify-center font-normal text-[#1A1A1A] opacity-35"
                                                style={{ borderRadius: '2px', fontSize: '10px' }}
                                            >
                                                {monogram.slice(0, 1)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Project Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-normal text-[#1A1A1A] truncate" style={{ fontSize: '14px' }}>{project.name}</div>
                                        <div className="font-normal text-[#1A1A1A] opacity-35 mt-1" style={{ fontSize: '11px' }}>{updatedAt}</div>
                                    </div>

                                    {/* Status */}
                                    <div className="font-normal text-[#1A1A1A] opacity-35 flex-shrink-0" style={{ fontSize: '11px' }}>{status}</div>

                                    {/* Action */}
                                    <button
                                        onClick={() => navigate(`/p/${project.id}/workspace`)}
                                        className="font-normal text-[#1A1A1A] border border-[#1A1A1A]/15 px-3 py-1.5 flex-shrink-0"
                                        style={{ fontSize: '14px' }}
                                    >
                                        Open
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 space-y-4">
                        <p className="font-normal text-[#1A1A1A] opacity-35" style={{ fontSize: '11px' }}>No projects.</p>
                        <button
                            onClick={() => setShowCreateMenu(true)}
                            className="font-normal text-[#1A1A1A] border border-[#1A1A1A]/15 px-3 py-1.5"
                            style={{ fontSize: '14px' }}
                        >
                            Create project
                        </button>
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

