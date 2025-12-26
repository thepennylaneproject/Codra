import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket,
    Eye,
    Scissors,
    TrendingUp,
    Gem,
    RefreshCw,
    Check,
    Zap,
    ChevronRight,
    Loader2,
    Crown,
    ArrowRight,
    Play,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '../../hooks/useAuth';
import { useSupabaseSpread } from '../../hooks/useSupabaseSpread';
import { useToast } from '../components/Toast';

import type {
    CoherenceScan,
    ScanType,
    ScanContext,
    ScanFinding,
    AuditType,
} from '../../domain/coherence-scan';
import {
    AUDIT_METADATA,
} from '../../domain/coherence-scan';
import { CLARIFYING_QUESTIONS, type ClarifyingQuestion } from '../../domain/audit-templates';
import {
    initiateScan,
    submitContextAndStartScan,
    getScan,
    toggleFindingSelection,
    convertFindingsToTasks,
} from '../../lib/coherence-scan/coherence-scan-service';
import {
    SCAN_LIMITS,
    getScansRemaining,
} from '../../lib/coherence-scan/scan-usage-tracker';
import {
    shouldSuggestLoop,
    initiateCoherenceLoop,
    compareScans,
    type LoopComparison,
} from '../../lib/coherence-scan/coherence-loop-service';
import { CoherenceLoopView } from '../components/CoherenceLoopView';
import { getProjects } from '../../domain/projects';
import type { Project } from '../../domain/types';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Icon mapping for audit types
const AUDIT_ICONS: Record<AuditType, typeof Rocket> = {
    'ship-ready': Rocket,
    'blind-spot': Eye,
    'kill-list': Scissors,
    'investor-diligence': TrendingUp,
    'unclaimed-value': Gem,
    'coherence-loop': RefreshCw,
};

// Severity colors
const SEVERITY_COLORS: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-600 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    low: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    info: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
};

type PageState = 'select' | 'questions' | 'scanning' | 'report' | 'loop-comparison';

export default function CoherenceScanPage() {
    const { scanId } = useParams<{ scanId?: string }>();
    const location = useLocation();
    const { user } = useAuth();
    const toast = useToast();

    // Get projectId from query params or fallback
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const routeProjectId = queryParams.get('projectId');
    const [projectId, setProjectId] = useState<string | null>(routeProjectId);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    
    // User tier from profile
    const userTier = (user?.user_metadata?.tier || 'free') as 'free' | 'pro' | 'team';
    const userId = user?.id || 'anonymous';

    // Supabase state for task integration
    const { taskQueue, saveTaskQueue } = useSupabaseSpread(projectId || undefined);

    // Page state
    const [pageState, setPageState] = useState<PageState>('select');
    const [, setSelectedScanType] = useState<ScanType | null>(null);
    const [currentScan, setCurrentScan] = useState<CoherenceScan | null>(null);
    const [loopComparison, setLoopComparison] = useState<LoopComparison | null>(null);

    // Questions state
    const [questionAnswers, setQuestionAnswers] = useState<Record<string, string | string[]>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Usage state
    const [scansRemaining, setScansRemaining] = useState<{
        quickChecks: { used: number; allowed: number };
        fullScans: { used: number; allowed: number };
    } | null>(null);

    // Load existing scan if scanId provided
    useEffect(() => {
        if (scanId) {
            const scan = getScan(scanId);
            if (scan) {
                setCurrentScan(scan);
                if (scan.projectId) {
                    setProjectId(scan.projectId);
                }
                if (scan.status === 'complete') {
                    if (scan.originalScanId) {
                        const originalScan = getScan(scan.originalScanId);
                        if (originalScan) {
                            setLoopComparison(compareScans(originalScan, scan));
                            setPageState('loop-comparison');
                        } else {
                            setPageState('report');
                        }
                    } else {
                        setPageState('report');
                    }
                } else if (scan.status === 'scanning') {
                    setPageState('scanning');
                }
            }
        }
    }, [scanId]);

    // Load projects for selection
    useEffect(() => {
        async function loadProjects() {
            setLoadingProjects(true);
            try {
                const data = await getProjects();
                setProjects(data);

                // Default to query param, else first project if none selected
                if (!projectId && data.length > 0) {
                    const nextId = data[0].id;
                    setProjectId(nextId);
                    const params = new URLSearchParams(location.search);
                    params.set('projectId', nextId);
                    const newQuery = params.toString();
                    const newUrl = `${location.pathname}?${newQuery}`;
                    window.history.replaceState({}, '', newUrl);
                } else if (projectId && !data.some(p => p.id === projectId) && data.length > 0) {
                    // If query param is stale, fall back to first available project
                    const fallback = data[0].id;
                    setProjectId(fallback);
                    const params = new URLSearchParams(location.search);
                    params.set('projectId', fallback);
                    const newQuery = params.toString();
                    const newUrl = `${location.pathname}?${newQuery}`;
                    window.history.replaceState({}, '', newUrl);
                    toast.info('Selected project was unavailable. Defaulted to your first workspace.');
                }
            } finally {
                setLoadingProjects(false);
            }
        }
        loadProjects();
    }, [location.pathname, location.search, projectId, toast]);

    // Load usage stats
    useEffect(() => {
        async function loadUsage() {
            const remaining = await getScansRemaining(userId, userTier);
            setScansRemaining(remaining);
        }
        loadUsage();
    }, [userId, userTier]);

    // Poll for scan completion
    useEffect(() => {
        if (pageState !== 'scanning' || !currentScan) return;

        const interval = setInterval(() => {
            const scan = getScan(currentScan.id);
            if (scan) {
                setCurrentScan(scan);
                if (scan.status === 'complete' || scan.status === 'failed') {
                    if (scan.originalScanId) {
                        const originalScan = getScan(scan.originalScanId);
                        if (originalScan) {
                            setLoopComparison(compareScans(originalScan, scan));
                            setPageState('loop-comparison');
                        } else {
                            setPageState('report');
                        }
                    } else {
                        setPageState('report');
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [pageState, currentScan]);

    const handleProjectChange = useCallback((nextId: string) => {
        setProjectId(nextId);
        const params = new URLSearchParams(location.search);
        if (nextId) {
            params.set('projectId', nextId);
        } else {
            params.delete('projectId');
        }
        const newQuery = params.toString();
        const newUrl = `${location.pathname}${newQuery ? `?${newQuery}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [location.pathname, location.search]);

    const handleSelectScanType = useCallback(async (scanType: ScanType) => {
        if (!projectId) {
            toast.warning('Select a workspace before running a scan.');
            return;
        }

        setSelectedScanType(scanType);

        // Initiate scan
        const result = await initiateScan(userId, projectId, scanType, userTier);

        if (!result.allowed) {
            // Show upgrade modal or message
            toast.error(result.error || 'Upgrade required to run this scan.');
            return;
        }

        setCurrentScan(result.scan);
        setPageState('questions');
        setCurrentQuestionIndex(0);
    }, [userId, projectId, userTier]);

    const handleAnswerQuestion = (questionId: string, value: string | string[]) => {
        setQuestionAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < CLARIFYING_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleStartScan = async () => {
        if (!currentScan) return;

        const context: ScanContext = {
            projectDescription: (questionAnswers['project-description'] as string) || '',
            targetAudience: (questionAnswers['target-audience'] as string) || '',
            launchTimeline: (questionAnswers['launch-timeline'] as string) as ScanContext['launchTimeline'] || 'exploring',
            knownConstraints: (questionAnswers['known-constraints'] as string[]) || [],
            focusAreas: (questionAnswers['focus-areas'] as string[]) || [],
        };

        await submitContextAndStartScan(currentScan.id, context);
        setPageState('scanning');
    };

    const handleToggleFinding = (findingId: string) => {
        if (!currentScan) return;
        toggleFindingSelection(currentScan.id, findingId);
        // Refresh scan state
        const updated = getScan(currentScan.id);
        if (updated) setCurrentScan(updated);
    };

    const handleAddToQueue = async () => {
        if (!projectId) {
            toast.warning('Pick a workspace to route findings to a task queue.');
            return;
        }
        if (!currentScan || !taskQueue) {
            toast.error("Task queue not loaded or scan missing.");
            return;
        }

        const newTasks = convertFindingsToTasks(currentScan, {
            projectId,
            title: 'Project Analysis Results',
        });

        if (newTasks.length === 0) {
            toast.warning("No findings selected to add.");
            return;
        }

        // Merge with existing queue
        const updatedTasks = [...taskQueue.tasks, ...newTasks];
        const updatedQueue = {
            ...taskQueue,
            tasks: updatedTasks,
            stale: true, // Mark for regeneration if needed, though these are manual additions
        };

        try {
            await saveTaskQueue(updatedQueue);
            toast.success(`${newTasks.length} task${newTasks.length > 1 ? 's' : ''} added to your workspace queue.`);
            
            // Mark findings as processed locally if needed, or just refresh
            const updatedScan = getScan(currentScan.id);
            if (updatedScan) setCurrentScan(updatedScan);
        } catch (err) {
            toast.error("Failed to add tasks to queue.");
            console.error(err);
        }
    };

    const handleStartLoop = async () => {
        if (!currentScan || currentScan.status !== 'complete') return;

        const loopScan = await initiateCoherenceLoop(currentScan.id, userId);
        if (loopScan) {
            // In a real implementation, this would involve a backend startScan call
            // For now, we manually set state and trigger scanning
            setCurrentScan(loopScan);
            setPageState('scanning');
            // Mocking starting the scan logic
            await submitContextAndStartScan(loopScan.id, loopScan.context || ({} as any));
        }
    };

    const isLoopSuggestible = currentScan ? shouldSuggestLoop(currentScan.id) : false;

    const limits = SCAN_LIMITS[userTier];
    const activeProject = projects.find(p => p.id === projectId);

    return (
        <div className="min-h-screen bg-[#FFFAF0]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#1A1A1A]/10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#1A1A1A]">Coherence Scan</h1>
                            <p className="text-xs text-[#8A8A8A]">Pre-deployment audit system</p>
                        </div>
                    </div>

                    {/* Usage Meter */}
                    {scansRemaining && (
                        <div className="flex items-center gap-4 text-xs">
                            <div className="text-right">
                                <span className="text-[#8A8A8A]">Scans this month:</span>
                                <span className="ml-2 font-bold text-[#1A1A1A]">
                                    {scansRemaining.fullScans.used}/{scansRemaining.fullScans.allowed}
                                </span>
                            </div>
                            {userTier === 'free' && (
                                <button className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 transition-colors">
                                    <Crown className="w-3 h-3" />
                                    Upgrade
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Project Context Selector */}
                <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-4 mb-6 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A] mb-1">Project Context</p>
                        {loadingProjects ? (
                            <div className="w-48 h-5 rounded-full bg-[#1A1A1A]/5 animate-pulse" />
                        ) : activeProject ? (
                            <>
                                <p className="text-sm font-semibold text-[#1A1A1A]">{activeProject.name}</p>
                                <p className="text-xs text-[#8A8A8A] line-clamp-1">
                                    Findings will be pushed to this workspace&apos;s task queue.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-[#8A8A8A]">
                                No workspace selected. Choose one to attach scan findings.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={projectId || ''}
                            onChange={(e) => handleProjectChange(e.target.value)}
                            disabled={loadingProjects || projects.length === 0}
                            className="px-3 py-2 border border-[#1A1A1A]/10 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                            <option value="" disabled>Select workspace</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                        {projects.length === 0 && (
                            <Link
                                to="/projects"
                                className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1A1A1A]/90"
                            >
                                Go to registry
                            </Link>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Select Scan Type */}
                    {pageState === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center max-w-lg mx-auto">
                                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Choose Your Scan</h2>
                                <p className="text-[#8A8A8A]">
                                    Select the depth of analysis you need for your project.
                                </p>
                            </div>

                            {/* Scan Type Cards */}
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Quick Check */}
                                <button
                                    onClick={() => handleSelectScanType('quick-check')}
                                    disabled={!projectId || loadingProjects}
                                    className={cn(
                                        "group text-left p-6 bg-white rounded-xl border border-[#1A1A1A]/10 transition-all",
                                        (!projectId || loadingProjects)
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:border-emerald-500 hover:shadow-lg"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-emerald-50 transition-colors">
                                        <Rocket className="w-6 h-6 text-zinc-500 group-hover:text-emerald-600" />
                                    </div>
                                    <h3 className="font-bold text-[#1A1A1A] mb-1">Quick Check</h3>
                                    <p className="text-sm text-[#8A8A8A] mb-4">
                                        Fast ship-readiness check. Perfect for a final review.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-emerald-600 font-medium">
                                            {userTier === 'free' ? 'Free' : 'Included'}
                                        </span>
                                        <span className="text-[#8A8A8A]">~30 seconds</span>
                                    </div>
                                </button>

                                {/* Full Scan */}
                                <button
                                    onClick={() => handleSelectScanType('full-scan')}
                                    disabled={(userTier === 'free' && limits.fullScansPerMonth === 0) || !projectId || loadingProjects}
                                    className={cn(
                                        "group text-left p-6 bg-white rounded-xl border transition-all relative",
                                        (userTier === 'free' && limits.fullScansPerMonth === 0) || !projectId || loadingProjects
                                            ? "border-[#1A1A1A]/10 opacity-60 cursor-not-allowed"
                                            : "border-[#1A1A1A]/10 hover:border-emerald-500 hover:shadow-lg"
                                    )}
                                >
                                    {userTier === 'free' && (
                                        <div className="absolute top-4 right-4">
                                            <Crown className="w-4 h-4 text-emerald-600" />
                                        </div>
                                    )}
                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                                        <Zap className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h3 className="font-bold text-[#1A1A1A] mb-1">Full Scan</h3>
                                    <p className="text-sm text-[#8A8A8A] mb-4">
                                        Comprehensive audit across all dimensions.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-emerald-600 font-medium">
                                            {limits.fullScansPerMonth}/month included
                                        </span>
                                        <span className="text-[#8A8A8A]">~2 minutes</span>
                                    </div>
                                </button>

                                {/* Deep Scan */}
                                <button
                                    onClick={() => handleSelectScanType('deep-scan')}
                                    disabled={!limits.deepScanAvailable || !projectId || loadingProjects}
                                    className={cn(
                                        "group text-left p-6 rounded-xl border transition-all relative",
                                        limits.deepScanAvailable
                                            ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-lg"
                                            : "bg-white border-[#1A1A1A]/10 opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <div className="absolute top-4 right-4">
                                        <span className="px-2 py-0.5 bg-[#1A1A1A] text-white text-[10px] font-bold rounded-full">
                                            PRO
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                                        <Eye className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <h3 className="font-bold text-[#1A1A1A] mb-1">Deep Scan</h3>
                                    <p className="text-sm text-[#8A8A8A] mb-4">
                                        Multi-model ensemble for maximum insight.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-teal-600 font-medium">$15-25 add-on</span>
                                        <span className="text-[#8A8A8A]">~5 minutes</span>
                                    </div>
                                </button>
                            </div>

                            {/* Audit Types Preview */}
                            <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                                <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">What We Analyze</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {Object.entries(AUDIT_METADATA).filter(([id]) => id !== 'coherence-loop').map(([id, audit]) => {
                                        const Icon = AUDIT_ICONS[id as AuditType];
                                        return (
                                            <div key={id} className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                                    <Icon className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-[#1A1A1A]">{audit.name}</div>
                                                    <div className="text-xs text-[#8A8A8A] line-clamp-2">{audit.description}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Clarifying Questions */}
                    {pageState === 'questions' && (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-lg mx-auto space-y-8"
                        >
                            {/* Progress */}
                            <div className="flex items-center gap-2">
                                {CLARIFYING_QUESTIONS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 h-1 rounded-full transition-colors",
                                            i <= currentQuestionIndex ? "bg-emerald-600" : "bg-[#1A1A1A]/10"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Current Question */}
                            <AnimatePresence mode="wait">
                                {CLARIFYING_QUESTIONS[currentQuestionIndex] && (
                                    <motion.div
                                        key={currentQuestionIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6"
                                    >
                                        <QuestionRenderer
                                            question={CLARIFYING_QUESTIONS[currentQuestionIndex]}
                                            value={questionAnswers[CLARIFYING_QUESTIONS[currentQuestionIndex].id]}
                                            onChange={(val) => handleAnswerQuestion(CLARIFYING_QUESTIONS[currentQuestionIndex].id, val)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 py-2 text-sm text-[#8A8A8A] hover:text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Back
                                </button>

                                {currentQuestionIndex < CLARIFYING_QUESTIONS.length - 1 ? (
                                    <button
                                        onClick={handleNextQuestion}
                                        className="flex items-center gap-2 px-6 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#1A1A1A]/90 transition-colors"
                                    >
                                        Continue
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStartScan}
                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Start Scan
                                        <Zap className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Scanning */}
                    {pageState === 'scanning' && currentScan && (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-lg mx-auto text-center space-y-8 py-12"
                        >
                            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-600 flex items-center justify-center animate-pulse">
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Scanning Your Project</h2>
                                <p className="text-[#8A8A8A]">
                                    Running {currentScan.auditTypes.length} audits...
                                </p>
                            </div>

                            {/* Audit Progress */}
                            <div className="space-y-3">
                                {currentScan.auditTypes.map((auditType, i) => {
                                    const Icon = AUDIT_ICONS[auditType];
                                    const audit = AUDIT_METADATA[auditType];
                                    // Mock: show first few as complete
                                    const isComplete = i < Math.floor(Date.now() / 2000) % currentScan.auditTypes.length;

                                    return (
                                        <div
                                            key={auditType}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                                isComplete ? "bg-emerald-50" : "bg-white"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                isComplete ? "bg-emerald-500" : "bg-zinc-100"
                                            )}>
                                                {isComplete ? (
                                                    <Check className="w-4 h-4 text-white" />
                                                ) : (
                                                    <Icon className="w-4 h-4 text-zinc-400" />
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-sm",
                                                isComplete ? "text-emerald-700" : "text-[#8A8A8A]"
                                            )}>
                                                {audit.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Report */}
                    {pageState === 'report' && currentScan && (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Summary Banner */}
                            {currentScan.summary && (
                                <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1A1A1A]">Scan Complete</h2>
                                            <p className="text-sm text-[#8A8A8A]">
                                                Found {currentScan.findings.length} findings across {currentScan.auditTypes.length} audits
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-[#1A1A1A]">
                                                {currentScan.summary.healthScore}
                                            </div>
                                            <div className="text-xs text-[#8A8A8A]">Health Score</div>
                                        </div>
                                    </div>

                                    {/* Severity Counts */}
                                    <div className="flex gap-4">
                                        {currentScan.summary.criticalCount > 0 && (
                                            <div className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                                                {currentScan.summary.criticalCount} Critical
                                            </div>
                                        )}
                                        {currentScan.summary.highCount > 0 && (
                                            <div className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium">
                                                {currentScan.summary.highCount} High
                                            </div>
                                        )}
                                        {currentScan.summary.mediumCount > 0 && (
                                            <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                                                {currentScan.summary.mediumCount} Medium
                                            </div>
                                        )}
                                        {currentScan.summary.lowCount > 0 && (
                                            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                                                {currentScan.summary.lowCount} Low
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Findings List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[#1A1A1A]">Findings</h3>
                                    <span className="text-xs text-[#8A8A8A]">
                                        {currentScan.findings.filter(f => f.selected).length} selected for action
                                    </span>
                                </div>

                                {currentScan.findings.map((finding) => (
                                    <FindingCard
                                        key={finding.id}
                                        finding={finding}
                                        onToggle={() => handleToggleFinding(finding.id)}
                                    />
                                ))}
                            </div>

                            {/* Action Bar */}
                            <div className="sticky bottom-4 bg-white/90 backdrop-blur-sm rounded-xl border border-[#1A1A1A]/10 p-4 flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="text-[#8A8A8A]">Selected: </span>
                                    <span className="font-bold text-[#1A1A1A]">
                                        {currentScan.findings.filter(f => f.selected).length} findings
                                    </span>
                                </div>
                                <button
                                    onClick={handleAddToQueue}
                                    disabled={currentScan.findings.filter(f => f.selected).length === 0}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add to Task Queue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Loop Suggestion Footer */}
                            {isLoopSuggestible && (
                                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin-slow" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#1A1A1A]">Ready for verification?</h4>
                                            <p className="text-sm text-emerald-700">
                                                You've addressed most findings. Start a coherence loop to verify improvements.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleStartLoop}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#1A1A1A]/90 transition-all font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        <Play className="w-4 h-4" />
                                        Start Loop
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 5: Loop Comparison */}
                    {pageState === 'loop-comparison' && loopComparison && (
                        <motion.div
                            key="loop-comparison"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-3xl mx-auto py-8"
                        >
                            <CoherenceLoopView
                                comparison={loopComparison}
                                onRunAnotherLoop={handleStartLoop}
                                onDismiss={() => setPageState('report')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// Question Renderer Component
function QuestionRenderer({
    question,
    value,
    onChange,
}: {
    question: ClarifyingQuestion;
    value: string | string[] | undefined;
    onChange: (val: string | string[]) => void;
}) {
    if (question.type === 'text') {
        return (
            <div className="space-y-4">
                <label className="block text-lg font-medium text-[#1A1A1A]">
                    {question.question}
                </label>
                <textarea
                    value={(value as string) || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder}
                    rows={3}
                    className="w-full px-4 py-3 border border-[#1A1A1A]/10 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
                />
            </div>
        );
    }

    if (question.type === 'select') {
        return (
            <div className="space-y-4">
                <label className="block text-lg font-medium text-[#1A1A1A]">
                    {question.question}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {question.options?.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onChange(opt.value)}
                            className={cn(
                                "px-4 py-3 rounded-lg border text-left transition-colors",
                                value === opt.value
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === 'multiselect') {
        const selectedValues = (value as string[]) || [];
        return (
            <div className="space-y-4">
                <label className="block text-lg font-medium text-[#1A1A1A]">
                    {question.question}
                </label>
                <div className="flex flex-wrap gap-2">
                    {question.options?.map((opt) => {
                        const isSelected = selectedValues.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    if (isSelected) {
                                        onChange(selectedValues.filter(v => v !== opt.value));
                                    } else {
                                        onChange([...selectedValues, opt.value]);
                                    }
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-full border text-sm transition-colors",
                                    isSelected
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                                )}
                            >
                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}

// Finding Card Component
function FindingCard({
    finding,
    onToggle,
}: {
    finding: ScanFinding;
    onToggle: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={cn(
                "bg-white rounded-xl border transition-all",
                finding.selected ? "border-emerald-400 shadow-md" : "border-[#1A1A1A]/10"
            )}
        >
            <div
                className="p-4 flex items-start gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Selection Toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                        finding.selected
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-[#1A1A1A]/20"
                    )}
                >
                    {finding.selected && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold uppercase rounded border",
                            SEVERITY_COLORS[finding.severity]
                        )}>
                            {finding.severity}
                        </span>
                        <span className="text-xs text-[#8A8A8A]">
                            {finding.category.replace(/-/g, ' ')}
                        </span>
                    </div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1">{finding.title}</h4>
                    <p className="text-sm text-[#8A8A8A] line-clamp-2">{finding.observation}</p>
                </div>

                {/* Effort Badge */}
                <div className="text-xs text-[#8A8A8A] shrink-0">
                    {finding.estimatedEffort}
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[#1A1A1A]/5 overflow-hidden"
                    >
                        <div className="p-4 pl-13 space-y-3 text-sm">
                            <div>
                                <div className="text-[#8A8A8A] text-xs uppercase tracking-wider mb-1">Why It Matters</div>
                                <p className="text-[#1A1A1A]">{finding.whyItMatters}</p>
                            </div>
                            <div>
                                <div className="text-[#8A8A8A] text-xs uppercase tracking-wider mb-1">User Impact</div>
                                <p className="text-[#1A1A1A]">{finding.userImpact}</p>
                            </div>
                            <div>
                                <div className="text-[#8A8A8A] text-xs uppercase tracking-wider mb-1">Recommendation</div>
                                <p className="text-[#1A1A1A]">{finding.recommendation}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
