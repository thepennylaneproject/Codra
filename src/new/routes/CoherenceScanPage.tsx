import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
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
import { useSpecification } from '../../hooks/useSpecification';
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
    getLatestScanForProject,
    resumeScan,
    registerScan,
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
import { Button } from '@/components/ui/Button';

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

type PageState = 'select' | 'questions' | 'scanning' | 'report' | 'loop-comparison';

export default function CoherenceScanPage() {
    const { scanId } = useParams<{ scanId?: string }>();
    const location = useLocation();
    const navigate = useNavigate();
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
    const { taskQueue, saveTaskQueue } = useSpecification(projectId || undefined);

    // Page state
    const [pageState, setPageState] = useState<PageState>('select');
    const [, setSelectedScanType] = useState<ScanType | null>(null);
    const [currentScan, setCurrentScan] = useState<CoherenceScan | null>(null);
    const [loopComparison, setLoopComparison] = useState<LoopComparison | null>(null);
    const resumeRef = useRef<string | null>(null);
    const [queuedFindingsCount, setQueuedFindingsCount] = useState<number | null>(null);

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

    // Recover latest scan for project when no scanId is present
    useEffect(() => {
        if (scanId || !projectId) return;

        const latest = getLatestScanForProject(projectId);
        if (!latest) return;

        const isActive = latest.status === 'pending'
            || latest.status === 'gathering'
            || latest.status === 'queued'
            || latest.status === 'scanning';

        if (!isActive) return;

        setCurrentScan(latest);
        setPageState(latest.status === 'scanning' ? 'scanning' : 'questions');
        navigate(`/coherence-scan/${latest.id}?projectId=${projectId}`, { replace: true });
    }, [scanId, projectId, navigate]);

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

    // Resume scans after reload
    useEffect(() => {
        if (!currentScan) return;
        if (currentScan.status !== 'queued' && currentScan.status !== 'scanning') return;
        if (resumeRef.current === currentScan.id) return;

        resumeRef.current = currentScan.id;
        resumeScan(currentScan.id).catch((error) => {
            console.error('Failed to resume scan:', error);
        });
    }, [currentScan]);

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
        navigate(`/coherence-scan/${result.scan.id}?projectId=${projectId}`, { replace: true });
        setPageState('questions');
        setCurrentQuestionIndex(0);
    }, [userId, projectId, userTier, navigate]);

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
            setQueuedFindingsCount(newTasks.length);
            
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
            registerScan(loopScan);
            // Mocking starting the scan logic
            await submitContextAndStartScan(loopScan.id, loopScan.context || ({} as any));
        }
    };

    const isLoopSuggestible = currentScan ? shouldSuggestLoop(currentScan.id) : false;

    const limits = SCAN_LIMITS[userTier];
    const activeProject = projects.find(p => p.id === projectId);
    const scanProgress = currentScan?.progress;
    const auditProgress = currentScan?.auditProgress || [];
    const completedAudits = scanProgress?.completedAudits
        ?? auditProgress.filter((audit) => audit.status === 'complete').length;
    const totalAudits = currentScan?.auditTypes.length ?? 0;
    const percentComplete = scanProgress?.percent
        ?? (totalAudits ? Math.round((completedAudits / totalAudits) * 100) : 0);
    const phaseLabel = scanProgress?.phase === 'queued'
        ? 'Queued'
        : scanProgress?.phase === 'running'
            ? 'Running audits'
            : scanProgress?.phase === 'finalizing'
                ? 'Finalizing report'
                : scanProgress?.phase === 'complete'
                    ? 'Complete'
                    : scanProgress?.phase === 'failed'
                        ? 'Failed'
                        : 'Preparing';

    return (
        <div className="min-h-screen bg-[#FFFAF0]">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel-light border-0 border-b border-[#1A1A1A]/10 rounded-none bg-white/80">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-text-primary">Coherence Scan</h1>
                            <p className="text-xs text-text-soft">Pre-deployment audit system</p>
                        </div>
                    </div>

                    {/* Usage Meter */}
                    {scansRemaining && (
                        <div className="flex items-center gap-4 text-xs">
                            <div className="text-right">
                                <span className="text-text-soft">Scans this month:</span>
                                <span className="ml-2 font-semibold text-text-primary">
                                    {scansRemaining.fullScans.used}/{scansRemaining.fullScans.allowed}
                                </span>
                            </div>
                            {userTier === 'free' && (
                                <Button
                                    disabled
                                    className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium hover:bg-amber-600 transition-colors"
                                >
                                    <Crown className="w-3 h-3" />
                                    Unavailable
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Project Context Selector */}
                <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-4 mb-6 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-text-soft mb-1">Project Context</p>
                        {loadingProjects ? (
                            <div className="w-48 h-5 rounded-full bg-[#1A1A1A]/5 animate-pulse" />
                        ) : activeProject ? (
                            <>
                                <p className="text-sm font-semibold text-text-primary">{activeProject.name}</p>
                                <p className="text-xs text-text-soft line-clamp-1">
                                    Findings will be pushed to this workspace&apos;s task queue.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-text-soft">
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
                                className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold hover:bg-[#1A1A1A]/90"
                            >
                                Open registry
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
                                <h2 className="text-xl font-semibold text-text-primary mb-2">Choose Your Scan</h2>
                                <p className="text-text-soft">
                                    Select the depth of analysis you need for your project.
                                </p>
                            </div>

                            {/* Scan Type Cards */}
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Quick Check */}
                                <Button
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
                                    <h3 className="font-semibold text-text-primary mb-1">Quick Check</h3>
                                    <p className="text-sm text-text-soft mb-4">
                                        Fast ship-readiness check. Perfect for a final review.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-emerald-600 font-medium">
                                            {userTier === 'free' ? 'Free' : 'Included'}
                                        </span>
                                        <span className="text-text-soft">~30 seconds</span>
                                    </div>
                                </Button>

                                {/* Full Scan */}
                                <Button
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
                                    <h3 className="font-semibold text-text-primary mb-1">Full Scan</h3>
                                    <p className="text-sm text-text-soft mb-4">
                                        Comprehensive audit across all dimensions.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-emerald-600 font-medium">
                                            {limits.fullScansPerMonth}/month included
                                        </span>
                                        <span className="text-text-soft">~2 minutes</span>
                                    </div>
                                </Button>

                                {/* Deep Scan */}
                                <Button
                                    onClick={() => handleSelectScanType('deep-scan')}
                                    disabled={!limits.deepScanAvailable || !projectId || loadingProjects}
                                    className={cn(
                                        "group text-left p-6 rounded-xl border transition-all relative",
                                        limits.deepScanAvailable
                                            ? "bg-emerald-50 border-emerald-200 hover:shadow-lg"
                                            : "bg-white border-[#1A1A1A]/10 opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <div className="absolute top-4 right-4">
                                        <span className="px-2 py-0 bg-[#1A1A1A] text-white text-xs font-semibold rounded-full">
                                            PRO
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
                                        <Eye className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <h3 className="font-semibold text-text-primary mb-1">Deep Scan</h3>
                                    <p className="text-sm text-text-soft mb-4">
                                        Multi-model ensemble for maximum insight.
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-teal-600 font-medium">$15-25 add-on</span>
                                        <span className="text-text-soft">~5 minutes</span>
                                    </div>
                                </Button>
                            </div>

                            {/* Audit Types Preview */}
                            <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                                <h3 className="text-sm font-semibold text-text-primary mb-4">What We Analyze</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {Object.entries(AUDIT_METADATA).filter(([id]) => id !== 'coherence-loop').map(([id, audit]) => {
                                        const Icon = AUDIT_ICONS[id as AuditType];
                                        return (
                                            <div key={id} className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                                    <Icon className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-text-primary">{audit.name}</div>
                                                    <div className="text-xs text-text-soft line-clamp-2">{audit.description}</div>
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
                                <Button
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 py-2 text-sm text-text-soft hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Open previous step
                                </Button>

                                {currentQuestionIndex < CLARIFYING_QUESTIONS.length - 1 ? (
                                    <Button
                                        onClick={handleNextQuestion}
                                        className="flex items-center gap-2 px-6 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#1A1A1A]/90 transition-colors"
                                    >
                                        Continue
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleStartScan}
                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Run scan
                                        <Zap className="w-4 h-4" />
                                    </Button>
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
                                <h2 className="text-xl font-semibold text-text-primary mb-2">Coherence scan in progress</h2>
                                <p className="text-text-soft">
                                    {phaseLabel} • {completedAudits}/{totalAudits} audits complete
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="h-1.5 w-full rounded-full bg-[#1A1A1A]/10 overflow-hidden">
                                    <div
                                        className="h-1.5 bg-emerald-600 transition-all"
                                        style={{ width: `${percentComplete}%` }}
                                    />
                                </div>
                                <div className="text-xs text-text-soft">
                                    {percentComplete}% complete
                                </div>
                            </div>

                            {/* Audit Progress */}
                            <div className="space-y-3 text-left">
                                {currentScan.auditTypes.map((auditType) => {
                                    const Icon = AUDIT_ICONS[auditType];
                                    const audit = AUDIT_METADATA[auditType];
                                    const status = auditProgress.find((item) => item.auditType === auditType)?.status ?? 'pending';
                                    const statusLabel = status === 'complete'
                                        ? 'Complete'
                                        : status === 'running'
                                            ? 'Running'
                                            : status === 'failed'
                                                ? 'Failed'
                                                : 'Queued';

                                    return (
                                        <div
                                            key={auditType}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#1A1A1A]/10 bg-white"
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100">
                                                {status === 'complete' ? (
                                                    <Check className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <Icon className="w-4 h-4 text-zinc-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm text-text-primary">{audit.name}</div>
                                                <div className="text-xs text-text-soft">{audit.description}</div>
                                            </div>
                                            <div className="text-[10px] uppercase tracking-widest text-text-soft/60">
                                                {statusLabel}
                                            </div>
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
                            {/* Report Header */}
                            <div className="bg-white rounded-xl border border-[#1A1A1A]/10 p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-text-primary">Coherence Scan Report</h2>
                                        <p className="text-sm text-text-soft">
                                            {currentScan.scanType.replace('-', ' ')} • {currentScan.auditTypes.length} audits
                                        </p>
                                    </div>
                                    <div className="text-sm text-text-soft">
                                        <div>Completed: {currentScan.completedAt ? new Date(currentScan.completedAt).toLocaleString() : 'Pending'}</div>
                                        <div>Project: {activeProject?.name || 'Unassigned'}</div>
                                    </div>
                                </div>

                                {currentScan.summary && (
                                    <div className="mt-6 grid md:grid-cols-4 gap-3 text-sm">
                                        <div className="border border-[#1A1A1A]/10 rounded-lg px-3 py-2">
                                            <div className="text-[10px] uppercase tracking-widest text-text-soft/60">Health Score</div>
                                            <div className="text-base font-semibold text-text-primary">{currentScan.summary.healthScore}</div>
                                        </div>
                                        <div className="border border-[#1A1A1A]/10 rounded-lg px-3 py-2">
                                            <div className="text-[10px] uppercase tracking-widest text-text-soft/60">Critical</div>
                                            <div className="text-base font-semibold text-text-primary">{currentScan.summary.criticalCount}</div>
                                        </div>
                                        <div className="border border-[#1A1A1A]/10 rounded-lg px-3 py-2">
                                            <div className="text-[10px] uppercase tracking-widest text-text-soft/60">High</div>
                                            <div className="text-base font-semibold text-text-primary">{currentScan.summary.highCount}</div>
                                        </div>
                                        <div className="border border-[#1A1A1A]/10 rounded-lg px-3 py-2">
                                            <div className="text-[10px] uppercase tracking-widest text-text-soft/60">Medium</div>
                                            <div className="text-base font-semibold text-text-primary">{currentScan.summary.mediumCount}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Findings List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-text-primary">Findings</h3>
                                    <span className="text-xs text-text-soft">
                                        {currentScan.findings.filter(f => f.selected).length} selected for action
                                    </span>
                                </div>
                                <ol className="space-y-4">
                                    {currentScan.findings.map((finding, index) => (
                                        <FindingCard
                                            key={finding.id}
                                            finding={finding}
                                            index={index + 1}
                                            onToggle={() => handleToggleFinding(finding.id)}
                                        />
                                    ))}
                                </ol>
                            </div>

                            {/* Action Bar */}
                            <div className="sticky bottom-4 glass-panel-light border-[#1A1A1A]/10 bg-white/90 rounded-xl p-4 flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="text-text-soft">Selected: </span>
                                    <span className="font-semibold text-text-primary">
                                        {currentScan.findings.filter(f => f.selected).length} findings
                                    </span>
                                    {queuedFindingsCount !== null && (
                                        <div className="mt-1 text-xs text-text-soft/70">
                                            Filed to workspace.{' '}
                                            <button
                                                onClick={() => projectId && navigate(`/p/${projectId}/workspace`, { replace: false })}
                                                className="text-[10px] uppercase tracking-widest underline underline-offset-4 text-text-soft/70 hover:text-text-primary"
                                            >
                                                Open desk
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleAddToQueue}
                                    disabled={currentScan.findings.filter(f => f.selected).length === 0}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add to Task Queue
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Loop Suggestion Footer */}
                            {isLoopSuggestible && (
                                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary">Verification available</h4>
                                            <p className="text-sm text-emerald-700">
                                                You&apos;ve addressed most findings. Start a coherence loop to verify improvements.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleStartLoop}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#1A1A1A]/90 transition-all font-semibold text-xs"
                                    >
                                        <Play className="w-4 h-4" />
                                        Run loop
                                    </Button>
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
                <label className="block text-base font-medium text-text-primary">
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
                <label className="block text-base font-medium text-text-primary">
                    {question.question}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {question.options?.map((opt) => (
                        <Button
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
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === 'multiselect') {
        const selectedValues = (value as string[]) || [];
        return (
            <div className="space-y-4">
                <label className="block text-base font-medium text-text-primary">
                    {question.question}
                </label>
                <div className="flex flex-wrap gap-2">
                    {question.options?.map((opt) => {
                        const isSelected = selectedValues.includes(opt.value);
                        return (
                            <Button
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
                            </Button>
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
    index,
    onToggle,
}: {
    finding: ScanFinding;
    index: number;
    onToggle: () => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={cn(
                "bg-white rounded-xl border transition-all",
                finding.selected ? "border-[#1A1A1A]/50 shadow-md" : "border-[#1A1A1A]/10"
            )}
        >
            <div
                className="p-4 flex items-start gap-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Selection Toggle */}
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0",
                        finding.selected
                            ? "border-[#1A1A1A] bg-[#1A1A1A]"
                            : "border-[#1A1A1A]/20"
                    )}
                >
                    {finding.selected && <Check className="w-3 h-3 text-white" />}
                </Button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-text-soft/60">
                            Finding {index}
                        </span>
                        <span className="h-3 w-px bg-[#1A1A1A]/10" />
                        <span className="text-[10px] uppercase tracking-widest text-text-soft/60">
                            {finding.category.replace(/-/g, ' ')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest border border-[#1A1A1A]/30 text-text-soft/70">
                            {finding.severity}
                        </span>
                        <h4 className="font-medium text-text-primary">{finding.title}</h4>
                    </div>
                    <p className="text-sm text-text-soft line-clamp-2">{finding.observation}</p>
                </div>

                {/* Effort Badge */}
                <div className="text-[10px] uppercase tracking-widest text-text-soft/60 shrink-0">
                    Effort {finding.estimatedEffort}
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
                        <div className="p-4 pl-12 space-y-3 text-sm">
                            <div>
                                <div className="text-text-soft text-xs mb-1 uppercase tracking-widest">Why it matters</div>
                                <p className="text-text-primary">{finding.whyItMatters}</p>
                            </div>
                            <div>
                                <div className="text-text-soft text-xs mb-1 uppercase tracking-widest">User impact</div>
                                <p className="text-text-primary">{finding.userImpact}</p>
                            </div>
                            <div>
                                <div className="text-text-soft text-xs mb-1 uppercase tracking-widest">Recommendation</div>
                                <p className="text-text-primary">{finding.recommendation}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
