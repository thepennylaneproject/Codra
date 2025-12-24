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
    Layers
} from 'lucide-react';
import { getProjects, createProject } from '../../domain/projects';
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
                            description: 'Explore this demo project to see how Codra works. Click through the Spread, try the Desks, and customize as you go!',
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
                                Production Registry
                            </span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter leading-none mb-4">
                            Studio Workspaces
                        </h1>
                        <p className="text-lg text-[#5A5A5A] max-w-md font-medium leading-relaxed italic">
                            Select a spread to resume editorial production or initiate a new client assignment.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative group w-full sm:w-64">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition-colors group-focus-within:text-[#FF4D4D]" />
                            <input
                                type="text"
                                placeholder="Filter workspaces..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-6 py-4 bg-white border border-[#1A1A1A]/10 rounded-2xl text-sm focus:outline-none focus:border-[#FF4D4D] transition-all w-full shadow-sm"
                            />
                        </div>
                        <button
                            onClick={handleSandbox}
                            className="px-8 py-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-amber-100 transition-all flex items-center gap-3 shadow-xl shadow-amber-900/5 active:scale-95 w-full sm:w-auto justify-center"
                        >
                            <Sparkles size={16} strokeWidth={3} className="text-amber-600" />
                            Sandbox
                        </button>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="import-project"
                                accept=".json"
                                className="hidden"
                                onChange={handleImportProject}
                            />
                            <button
                                onClick={() => document.getElementById('import-project')?.click()}
                                className="px-6 py-4 bg-white text-[#1A1A1A] border border-[#1A1A1A]/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Download size={14} strokeWidth={3} />
                                Import
                            </button>
                            <button
                                onClick={handleImportCodebase}
                                className="px-6 py-4 bg-white text-[#1A1A1A] border border-[#1A1A1A]/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Github size={14} />
                                Codebase
                            </button>
                            <button
                                onClick={() => navigate('/onboarding/new-project')}
                                className="px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#FF4D4D] transition-all flex items-center gap-3 shadow-xl shadow-[#1A1A1A]/10 active:scale-95 w-full sm:w-auto justify-center"
                            >
                                <Plus size={16} strokeWidth={3} />
                                New Project
                            </button>
                        </div>
                        <button
                            onClick={() => navigate('/blueprints')}
                            className="px-6 py-4 bg-white text-[#8A8A8A] hover:text-[#FF4D4D] border border-[#1A1A1A]/5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 group"
                        >
                            <Layers size={14} className="group-hover:text-[#FF4D4D]" />
                            Browse Blueprints
                        </button>
                        <button
                            onClick={() => navigate('/pricing')}
                            className="px-6 py-4 bg-white text-[#8A8A8A] hover:text-[#FF4D4D] border border-[#1A1A1A]/5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
                        >
                            Pricing
                        </button>
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
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                            <Sparkles size={48} className="mb-6 text-[#1A1A1A]" />
                            <h2 className="text-2xl font-bold mb-2">No workspaces found</h2>
                            <p className="text-sm">Initiate a new project to populate your registry.</p>
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

function ProjectCard({ project, onClick, delay = 0 }: { project: Project, onClick: () => void, delay?: number }) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClick}
            className="group relative flex flex-col text-left active:scale-[0.98] transition-transform"
        >
            {/* Card Body */}
            <div className="relative p-8 bg-white border border-[#1A1A1A]/5 rounded-3xl overflow-hidden transition-all group-hover:border-[#FF4D4D]/20 group-hover:shadow-2xl group-hover:shadow-[#1A1A1A]/5">
                {/* Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1A1A1A]/5 group-hover:bg-[#FF4D4D] transition-colors" />

                {/* Content */}
                <div className="flex justify-between items-start mb-8">
                    <div className="p-3 bg-[#FFFAF0] rounded-2xl text-[#1A1A1A]">
                        <LayoutTemplate size={20} />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A]/5 rounded-full">
                        <div className="w-1 h-1 rounded-full bg-[#1A1A1A]/40" />
                        <span className="text-[9px] font-bold uppercase tracking-tight text-[#1A1A1A]/60">Revision Stable</span>
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
                            <span>Editorial active</span>
                        </div>
                    </div>
                    <ArrowUpRight size={16} className="text-[#1A1A1A]/20 group-hover:text-[#FF4D4D] transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </div>

            {/* Subtle Reflection Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-tr from-transparent via-[#FFFAF0] to-transparent" />
        </motion.button>
    );
}
