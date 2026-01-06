import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Search,
    Download,
    Github,
    Layers,
    MoreVertical,
    Trash2,
    Upload,
} from 'lucide-react';
import { getProjects, createProject, deleteProject } from '../../domain/projects';
import { Project, ProductionDeskId } from '../../domain/types';
import { useToast } from '../components/Toast';
import { FirstRunModal } from '../components/FirstRunModal';
import { Button } from '@/components/ui/Button';
import { ExportModal } from '@/components/export/ExportModal';
import { useChecklist } from '@/hooks/useChecklist';

/**
 * PROJECTS PAGE
 * Clean, Ivory & Ink grid for project selection.
 */
type ProjectStatus = 'Idle' | 'Running' | 'Failed' | 'Complete' | 'Provisioning' | 'Incomplete';

export function ProjectsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [codebaseModalOpen, setCodebaseModalOpen] = useState(false);
    const [codebaseUrl, setCodebaseUrl] = useState('');
    const toast = useToast();
    const [exportProject, setExportProject] = useState<Project | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    const [isFetching, setIsFetching] = useState(false);
    const { completedCount, allComplete, items } = useChecklist();

    useEffect(() => {
        const DEMO_SEEDED_KEY = 'codra:demoProjectSeeded';

        const fetchProjects = async () => {
            if (isFetching) return;
            setIsFetching(true);
            try {
                const data = await getProjects();

                // Seed demo project for new users if not already present in data or localStorage
                const hasDemo = data.some(p => p.name === 'Codra system overview');
                if (!localStorage.getItem(DEMO_SEEDED_KEY) && !hasDemo && data.length <= 1) {
                    try {
                        const demoProject = await createProject({
                            projectName: 'Codra system overview',
                            description: 'Review this demo project to see how Codra operates. Open the workspace, review desks, and adjust configuration.',
                            audience: 'New users learning Codra',
                            goals: ['Review the workspace', 'Run AI execution', 'Configure the project'],
                            boundaries: ['Non-production environment; changes are isolated.'],
                            budgetPolicy: { maxCostPerRun: 25, dailyLimit: 100, approvalRequired: false },
                            selectedDesks: ['design', 'write', 'code'] as ProductionDeskId[],
                            moodboard: []
                        });

                        // Mark as seeded
                        localStorage.setItem(DEMO_SEEDED_KEY, 'true');
                        setProjects([demoProject, ...data]);
                        toast.info('Demo project created. Open to review system behavior.');
                    } catch (e) {
                        console.error('Failed to seed demo project:', e);
                        setProjects(data);
                    }
                } else {
                    if (hasDemo) localStorage.setItem(DEMO_SEEDED_KEY, 'true');
                    setProjects(data);
                }
            } finally {
                setLoading(false);
                setIsFetching(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /*
    const handleCreateExecutionWorkspace = async () => {
        const playgroundProject = await createProject({
            projectName: 'Execution workspace',
            description: 'Non-production execution workspace with all desks active.',
            audience: 'Self',
            goals: ['Experimentation', 'Asset Drafting'],
            boundaries: [],
            budgetPolicy: { maxCostPerRun: 10, dailyLimit: 100, approvalRequired: false },
            selectedDesks: PRODUCTION_DESKS.map(d => d.id) as ProductionDeskId[],
            moodboard: []
        });
        navigate(`/p/${playgroundProject.id}/workspace`);
    };
    */

    const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const projectData = JSON.parse(event.target?.result as string);
                // Simple validation check
                if (!projectData.name) throw new Error("Invalid project data");

                const newProject = await createProject({
                    ...projectData,
                    projectName: projectData.name,
                    selectedDesks: projectData.selectedDesks || projectData.activeDesks || []
                });
                toast.success(`Project "${newProject.name}" imported successfully.`);
                setProjects(prev => [newProject, ...prev]);
            } catch (err) {
                toast.error("Failed to import project. Please ensure the file is a valid Codra export.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleImportCodebase = () => {
        setCodebaseModalOpen(true);
    };

    const handleDeleteProject = async (projectId: string) => {
        try {
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success('Project deleted');
        } catch (err) {
            toast.error('Failed to delete project');
            console.error(err);
        }
    };

    const handleExportProject = (project: Project) => {
        setExportProject(project);
        setIsExportModalOpen(true);
    };

    const confirmCodebaseImport = async () => {
        if (!codebaseUrl.trim()) {
            toast.warning('Please enter a repository URL');
            return;
        }
        setCodebaseModalOpen(false);
        toast.info(`Indexing codebase: ${codebaseUrl}`);

        // Simulate by creating an Engineering-focused sandbox
        const engineeringProject = await createProject({
            projectName: codebaseUrl.split('/').pop() || 'Codebase Project',
            description: `Engineering project from ${codebaseUrl}`,
            audience: 'Developers',
            goals: ['Code Review', 'Refactoring', 'Documentation'],
            boundaries: [],
            budgetPolicy: { maxCostPerRun: 10, dailyLimit: 100, approvalRequired: false },
            selectedDesks: ['code'] as ProductionDeskId[],
            moodboard: []
        });
        setCodebaseUrl('');
        navigate(`/p/${engineeringProject.id}/workspace`);
    };

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

    return (
        <div className="min-h-screen flex flex-col bg-[#FFFAF0] text-text-primary font-sans selection:bg-zinc-300/40">
            {/* First-Run Welcome Modal */}
            <FirstRunModal />

            {/* Masthead */}
            <header className="page-gutter border-b border-[var(--ui-border)]/15">
                <div className="page-container flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-title text-text-primary mb-2">
                            Projects
                        </h1>
                        <p className="text-helper text-text-soft/50">
                            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                        </p>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative group w-full sm:w-48">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft/40 transition-colors group-focus-within:text-text-soft" />
                                <input
                                    type="text"
                                    placeholder="Filter..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-3 py-2 bg-white border border-[var(--ui-border)]/15 rounded-lg text-helper text-text-primary placeholder:text-text-soft/40 focus:outline-none focus:border-[var(--ui-border)]/30 transition-all w-full"
                                />
                            </div>

                            {/* Primary Action */}
                            <Button
                                onClick={() => navigate('/new')}
                                className="px-6 py-2 bg-rose-600 text-white rounded-lg font-semibold text-sm hover:bg-rose-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                            >
                                <Plus size={14} />
                                Create project
                            </Button>

                            <div className="relative">
                                <Button
                                    onClick={() => setShowActionsMenu(prev => !prev)}
                                    className="px-4 py-2 bg-white text-text-soft border border-[var(--ui-border)]/15 rounded-lg text-sm hover:bg-zinc-50 transition-all flex items-center gap-2"
                                >
                                    <MoreVertical size={14} />
                                    More
                                </Button>
                                {showActionsMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-[var(--ui-border)]/15 shadow-lg overflow-hidden z-10">
                                        <Button
                                            onClick={() => {
                                                setShowActionsMenu(false);
                                                document.getElementById('import-project')?.click();
                                            }}
                                            className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-text-secondary hover:bg-zinc-50 transition-colors"
                                        >
                                            <Download size={14} />
                                            Import
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowActionsMenu(false);
                                                navigate('/blueprints');
                                            }}
                                            className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-text-secondary hover:bg-zinc-50 transition-colors"
                                        >
                                            <Layers size={14} />
                                            Templates
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowActionsMenu(false);
                                                handleImportCodebase();
                                            }}
                                            className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-text-secondary hover:bg-zinc-50 transition-colors"
                                        >
                                            <Github size={14} />
                                            Codebase
                                        </Button>
                                    </div>
                                )}
                                {showActionsMenu && (
                                    <div
                                        className="fixed inset-0 z-0"
                                        onClick={() => setShowActionsMenu(false)}
                                    />
                                )}
                            </div>
                        </div>

                        <input
                            type="file"
                            id="import-project"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportProject}
                        />
                    </div>
                </div>
            </header>

            {/* Grid */}
            <main className="page-gutter">
                <div className="page-container">
                    {!allComplete && (
                        <div className="mb-6 flex items-center gap-2 text-helper text-text-soft/60">
                            <span>{completedCount}/{items.length} configured</span>
                            <span className="text-text-soft/30">·</span>
                            <button
                                onClick={() => navigate('/settings')}
                                className="text-text-soft/60 hover:text-text-primary transition-colors underline underline-offset-2"
                            >
                                Complete setup
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-[#1A1A1A]/5 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border border-[var(--ui-border)]/15 bg-white">
                            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 py-2.5 text-meta text-text-soft/50 border-b border-[var(--ui-border)]/15">
                                <div>Project</div>
                                <div>Updated</div>
                                <div>Status</div>
                                <div></div>
                            </div>
                            <div className="divide-y divide-[var(--ui-border)]/10">
                                {filteredProjects.map((project) => {
                                    const status = statusMap.get(project.id) ?? 'Idle';
                                    return (
                                        <ProjectRow
                                            key={project.id}
                                            project={project}
                                            status={status}
                                            onOpen={() => navigate(`/p/${project.id}/workspace`)}
                                            onDelete={() => handleDeleteProject(project.id)}
                                            onExport={() => handleExportProject(project)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-body text-text-soft/40">
                                No projects
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Legal Footer */}
            <footer className="page-container page-gutter border-t border-[var(--ui-border)]/15 flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="text-meta text-text-soft/30">
                    © 2025 Codra
                </span>
                <div className="flex items-center gap-6">
                    <Link to="/terms" className="text-meta text-text-soft/30 hover:text-text-soft transition-colors">Terms</Link>
                    <Link to="/privacy" className="text-meta text-text-soft/30 hover:text-text-soft transition-colors">Privacy</Link>
                </div>
            </footer>

            {/* Codebase Import Modal */}
            {codebaseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center glass-panel border-0 rounded-none bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                                    <Github size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold">Codebase import</h2>
                                    <p className="text-xs text-zinc-400">Enter a GitHub repository URL or local path</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                value={codebaseUrl}
                                onChange={(e) => setCodebaseUrl(e.target.value)}
                                placeholder="https://github.com/user/repo or /path/to/project"
                                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-zinc-400 transition-colors"
                                autoFocus
                            />
                            <p className="text-xs text-zinc-400">
                                We&apos;ll index the repository and set up an Engineering-focused workspace.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-zinc-100">
                            <Button
                                onClick={() => { setCodebaseModalOpen(false); setCodebaseUrl(''); }}
                                className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={confirmCodebaseImport}
                                className="px-6 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                            >
                                Import codebase
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                defaultScope="context"
                contextData={exportProject ? {
                    audience: {
                        primary: exportProject.audience || '',
                        context: exportProject.audienceContext,
                    },
                    brand: exportProject.brandConstraints || {},
                    success: exportProject.successCriteria || {},
                    guardrails: exportProject.guardrails || {},
                } : undefined}
                projectName={exportProject?.name}
            />
        </div>
    );
}

function ProjectRow({
    project,
    status,
    onOpen,
    onDelete,
    onExport,
}: {
    project: Project;
    status: ProjectStatus;
    onOpen: () => void;
    onDelete: () => void;
    onExport: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const updatedAt = new Date(project.updatedAt).toLocaleString();
    const statusStyles = getStatusStyles(status);

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onExport();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        if (window.confirm(`Close project "${project.name}"? This deletes the project.`)) {
            onDelete();
        }
    };

    return (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 py-3 items-center">
            <div className="min-w-0">
                <div className="text-body text-text-primary truncate">{project.name}</div>
            </div>
            <div className="text-helper text-text-soft/50">{updatedAt}</div>
            <div>
                <span className={`text-helper ${statusStyles}`}>
                    {status}
                </span>
            </div>
            <div className="flex items-center justify-end gap-2">
                <Button
                    onClick={onOpen}
                    className="px-3 py-1.5 text-helper text-text-primary border border-[var(--ui-border)]/15 rounded-md hover:bg-zinc-50 transition-all"
                >
                    Open
                </Button>
                <div className="relative">
                    <Button
                        onClick={() => setShowMenu(prev => !prev)}
                        className="p-1.5 rounded-md text-text-soft/40 hover:text-text-soft hover:bg-zinc-50 transition-all"
                    >
                        <MoreVertical size={14} />
                    </Button>
                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg border border-[var(--ui-border)]/15 shadow-lg overflow-hidden z-10">
                            <Button
                                onClick={handleExport}
                                className="w-full px-3 py-2 flex items-center gap-2 text-helper text-text-secondary hover:bg-zinc-50 transition-colors"
                            >
                                <Upload size={12} />
                                Export
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="w-full px-3 py-2 flex items-center gap-2 text-helper text-text-secondary hover:bg-zinc-50 transition-colors border-t border-[var(--ui-border)]/10"
                            >
                                <Trash2 size={12} />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            {showMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
}

function getStatusStyles(status: ProjectStatus) {
    switch (status) {
        case 'Running':
            return 'text-text-primary';
        case 'Failed':
            return 'text-amber-600/70';
        case 'Complete':
            return 'text-emerald-600/70';
        case 'Provisioning':
        case 'Incomplete':
        case 'Idle':
        default:
            return 'text-text-soft/40';
    }
}
