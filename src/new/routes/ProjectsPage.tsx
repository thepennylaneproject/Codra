import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    Clock,
    LayoutTemplate,
    FileText,
    Sparkles,
    ArrowUpRight,
    Download,
    Github,
    Settings,
    User,
    Layers,
    MoreVertical,
    Trash2,
    Upload
    Zap
} from 'lucide-react';
import { getProjects, createProject, deleteProject } from '../../domain/projects';
import { Project, PRODUCTION_DESKS, ProductionDeskId } from '../../domain/types';
import { useToast } from '../components/Toast';
import { FirstRunModal } from '../components/FirstRunModal';

/**
 * PROJECTS PAGE
 * Clean, Ivory & Ink grid for project selection.
 */
export function ProjectsPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [codebaseModalOpen, setCodebaseModalOpen] = useState(false);
    const [codebaseUrl, setCodebaseUrl] = useState('');
    const toast = useToast();

    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        const DEMO_SEEDED_KEY = 'codra:demoProjectSeeded';

        const fetchProjects = async () => {
            if (isFetching) return;
            setIsFetching(true);
            try {
                const data = await getProjects();

                // Seed demo project for new users if not already present in data or localStorage
                const hasDemo = data.some(p => p.name === 'Welcome to Codra');
                if (!localStorage.getItem(DEMO_SEEDED_KEY) && !hasDemo && data.length <= 1) {
                    try {
                        const demoProject = await createProject({
                            projectName: 'Welcome to Codra',
                            description: 'Explore this demo project to see how Codra works. Try the workspace, visit the Desks, and customize as you go!',
                            audience: 'New users learning Codra',
                            goals: ['Explore the workspace', 'Try AI generation', 'Customize your first project'],
                            boundaries: ['This is a sandbox — experiment freely!'],
                            budgetPolicy: { maxCostPerRun: 25, dailyLimit: 100, approvalRequired: false },
                            selectedDesks: ['art-design', 'writing', 'engineering'] as ProductionDeskId[],
                            moodboard: []
                        });

                        // Mark as seeded
                        localStorage.setItem(DEMO_SEEDED_KEY, 'true');
                        setProjects([demoProject, ...data]);
                        toast.info('Welcome! We created a demo project for you to explore.');
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

    const handleSandbox = async () => {
        const playgroundProject = await createProject({
            projectName: 'AI Playground',
            description: 'Ad-hoc experimentation sandbox with all desks active.',
            audience: 'Self',
            goals: ['Experimentation', 'Asset Drafting'],
            boundaries: [],
            budgetPolicy: { maxCostPerRun: 10, dailyLimit: 100, approvalRequired: false },
            selectedDesks: PRODUCTION_DESKS.map(d => d.id) as ProductionDeskId[],
            moodboard: []
        });
        navigate(`/p/${playgroundProject.id}/spread`);
    };

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
        const exportData = {
            name: project.name,
            description: project.description,
            audience: project.audience,
            goals: project.goals,
            boundaries: project.boundaries,
            budgetPolicy: project.budgetPolicy,
            activeDesks: project.activeDesks,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported "${project.name}"`);
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
            selectedDesks: ['engineering'] as ProductionDeskId[],
            moodboard: []
        });
        setCodebaseUrl('');
        navigate(`/p/${engineeringProject.id}/spread`);
    };

    return (
        <div className="min-h-screen bg-[#FFFAF0] text-[#1A1A1A] font-sans selection:bg-[#FF4D4D]/20">
            {/* First-Run Welcome Modal */}
            <FirstRunModal />

            {/* Masthead */}
            <header className="px-8 py-12 border-b border-[#1A1A1A]/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-pulse" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8A8A]">
                                Studio Registry
                            </span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter leading-none mb-4">
                            Studio Workspaces
                        </h1>
                        <p className="text-lg text-[#5A5A5A] max-w-md font-medium leading-relaxed italic">
                            Select a project to continue, or start a new one.
                        </p>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative group w-full sm:w-56">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition-colors group-focus-within:text-[#FF4D4D]" />
                                <input
                                    type="text"
                                    placeholder="Filter workspaces..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 pr-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl text-sm focus:outline-none focus:border-[#FF4D4D] transition-all w-full shadow-sm"
                                />
                            </div>

                            {/* Sandbox */}
                            <button
                                onClick={handleSandbox}
                                className="px-6 py-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-100 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                            >
                                <Sparkles size={14} strokeWidth={3} className="text-amber-600" />
                                Sandbox
                            </button>

                            {/* New Workspace - Hero CTA */}
                            <button
                                onClick={() => navigate('/onboarding/new-project')}
                                className="px-8 py-3 bg-[#1A1A1A] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#FF4D4D] transition-all flex items-center gap-2 shadow-lg shadow-[#1A1A1A]/10 active:scale-95"
                            >
                                <Plus size={14} strokeWidth={3} />
                                New Workspace
                            </button>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/blueprints')}
                                className="px-4 py-2 text-[#5A5A5A] hover:text-[#FF4D4D] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
                            >
                                <Layers size={12} />
                                Templates
                            </button>

                            <span className="text-[#1A1A1A]/20">|</span>

                            <input
                                type="file"
                                id="import-project"
                                accept=".json"
                                className="hidden"
                                onChange={handleImportProject}
                            />
                            <button
                                onClick={() => document.getElementById('import-project')?.click()}
                                className="px-4 py-2 text-[#5A5A5A] hover:text-[#FF4D4D] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
                            >
                                <Download size={12} />
                                Import
                            </button>

                            <button
                                onClick={handleImportCodebase}
                                className="px-4 py-2 text-[#5A5A5A] hover:text-[#FF4D4D] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 group relative"
                            >
                                <Github size={12} />
                                Codebase
                                <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-amber-100 text-amber-700 text-[7px] font-black rounded uppercase">Beta</span>
                            </button>

                            <span className="text-[#1A1A1A]/20">|</span>

                            <button
                                onClick={() => navigate('/coherence-scan')}
                                className="px-4 py-2 text-emerald-600 hover:text-emerald-700 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 group"
                            >
                                <Zap size={12} strokeWidth={3} />
                                Coherence Scan
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute top-8 right-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-3 text-zinc-400 hover:text-[#1A1A1A] hover:bg-zinc-100 rounded-2xl transition-all group"
                        title="Global Settings"
                    >
                        <Settings size={22} className="group-hover:rotate-45 transition-transform duration-500" />
                    </button>
                    <div className="p-3 border-2 border-[#1A1A1A] rounded-2xl bg-white shadow-[4px_4px_0px_#1A1A1A] group cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
                        <User size={22} strokeWidth={2.5} />
                    </div>
                </div>
            </header>

            {/* Grid */}
            <main className="px-8 py-16">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-[#1A1A1A]/5 rounded-3xl" />
                            ))}
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProjects.map((project, idx) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    delay={idx * 0.05}
                                    onClick={() => navigate(`/p/${project.id}/spread`)}
                                    onDelete={() => handleDeleteProject(project.id)}
                                    onExport={() => handleExportProject(project)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-[#FF4D4D]/10 flex items-center justify-center mb-8">
                                <Sparkles size={40} className="text-[#FF4D4D]" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-[#1A1A1A]">No projects yet</h2>
                            <p className="text-[#5A5A5A] mb-8 max-w-sm">Start your first project to experience AI-powered creative production.</p>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/onboarding/new-project')}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#FF4D4D] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl"
                                >
                                    <Plus size={16} />
                                    Create First Project
                                </button>
                                <button
                                    onClick={handleSandbox}
                                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#5A5A5A] hover:text-[#1A1A1A] rounded-xl font-bold text-xs transition-all border border-[#1A1A1A]/10"
                                >
                                    <Sparkles size={14} />
                                    Try Demo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Legal Footer */}
            <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-[#1A1A1A]/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A]">
                        © 2025 Codra Production Lab
                    </span>
                </div>
                <div className="flex items-center gap-8">
                    <Link to="/terms" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A] hover:text-[#FF4D4D] transition-colors">Terms of Service</Link>
                    <Link to="/privacy" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A] hover:text-[#FF4D4D] transition-colors">Privacy Policy</Link>
                </div>
            </footer>

            {/* Codebase Import Modal */}
            {codebaseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                                    <Github size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Import Codebase</h2>
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
                                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#FF4D4D] transition-colors"
                                autoFocus
                            />
                            <p className="text-xs text-zinc-400">
                                We'll index the repository and set up an Engineering-focused workspace.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-zinc-100">
                            <button
                                onClick={() => { setCodebaseModalOpen(false); setCodebaseUrl(''); }}
                                className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCodebaseImport}
                                className="px-6 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors"
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project, onClick, onDelete, onExport, delay = 0 }: { project: Project, onClick: () => void, onDelete: () => void, onExport: () => void, delay?: number }) {
    const [showMenu, setShowMenu] = useState(false);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onExport();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
            onDelete();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex flex-col text-left"
        >
            {/* Card Body */}
            <button
                onClick={onClick}
                className="relative p-8 bg-white border border-[#1A1A1A]/5 rounded-3xl overflow-hidden transition-all group-hover:border-[#FF4D4D]/20 group-hover:shadow-2xl group-hover:shadow-[#1A1A1A]/5 text-left active:scale-[0.98]"
            >
                {/* Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1A1A1A]/5 group-hover:bg-[#FF4D4D] transition-colors" />

                {/* Content */}
                <div className="flex justify-between items-start mb-8">
                    <div className="p-3 bg-[#FFFAF0] rounded-2xl text-[#1A1A1A]">
                        <LayoutTemplate size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A]/5 rounded-full">
                            <div className="w-1 h-1 rounded-full bg-[#1A1A1A]/40" />
                            <span className="text-[9px] font-bold uppercase tracking-tight text-[#1A1A1A]/60">Revision Stable</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-[#FF4D4D] transition-colors leading-none">
                    {project.name}
                </h3>
                <p className="text-sm text-[#5A5A5A] mb-8 line-clamp-2 leading-relaxed h-10">
                    {project.description || "Production phase initiated. Desk coordination active."}
                </p>

                <div className="flex items-center justify-between border-t border-[#1A1A1A]/5 pt-6 mt-auto">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#8A8A8A]">
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FileText size={12} />
                            <span>Active</span>
                        </div>
                    </div>
                    <ArrowUpRight size={16} className="text-[#1A1A1A]/20 group-hover:text-[#FF4D4D] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </button>

            {/* Menu Button */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={handleMenuClick}
                    className="p-2 rounded-xl bg-white/80 hover:bg-white border border-[#1A1A1A]/5 text-[#8A8A8A] hover:text-[#1A1A1A] transition-all opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical size={16} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl border border-[#1A1A1A]/10 shadow-xl overflow-hidden">
                        <button
                            onClick={handleExport}
                            className="w-full px-4 py-3 flex items-center gap-2 text-sm text-[#5A5A5A] hover:bg-zinc-50 transition-colors"
                        >
                            <Upload size={14} />
                            Export Project
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-3 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-zinc-100"
                        >
                            <Trash2 size={14} />
                            Delete Project
                        </button>
                    </div>
                )}
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                />
            )}

            {/* Subtle Reflection Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-tr from-transparent via-[#FFFAF0] to-transparent rounded-3xl" />
        </motion.div>
    );
}
