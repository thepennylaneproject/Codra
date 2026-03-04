import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboardingStore } from '../store';
import { createProject } from '../../../../domain/projects';
import { generateMoodboardV2 } from '../moodboardGeneratorV2';
import { ProjectContextRevision } from '../../../../domain/types';
import { Loader2, Sparkles, FileText, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    loadGenerationSessionById,
    saveGenerationSessionById,
} from '../utils/generationSession';
import { storageAdapter } from '@/lib/storage/StorageKeyAdapter';

type GenerationPhase = 'starting' | 'moodboard' | 'tear-sheet' | 'project' | 'complete';

const PHASE_LABELS: Record<GenerationPhase, string> = {
    starting: 'Initializing...',
    moodboard: 'Generating Moodboard v1...',
    'tear-sheet': 'Creating Tear Sheet v1...',
    project: 'Setting up project workspace...',
    complete: 'Provisioning complete',
};

export const GeneratingStep = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        profile,
        buildProjectData,
        buildProjectContextSnapshot,
        setGeneratedMoodboard,
        setCreatedProjectId,
        setStep,
    } = useOnboardingStore();

    const [phase, setPhase] = useState<GenerationPhase>('starting');
    const [error, setError] = useState<string | null>(null);
    const [waitingForResume, setWaitingForResume] = useState(false);
    const [generationSessionId] = useState(
        () => searchParams.get('generationSessionId') || crypto.randomUUID()
    );

    useEffect(() => {
        if (searchParams.get('generationSessionId') === generationSessionId) return;
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('generationSessionId', generationSessionId);
        navigate(`/new?${nextParams.toString()}`, { replace: true });
    }, [searchParams, generationSessionId, navigate]);

    useEffect(() => {
        let isMounted = true;

        const generate = async () => {
            try {
                const storedSession = loadGenerationSessionById(generationSessionId);
                if (storedSession?.status === 'complete' && storedSession.projectId) {
                    navigate(`/p/${storedSession.projectId}/context?mode=draft&from=onboarding`, { replace: true });
                    return;
                }

                if (storedSession?.status === 'running' && storedSession.startedAt) {
                    setWaitingForResume(true);
                    return;
                }

                saveGenerationSessionById(generationSessionId, {
                    id: generationSessionId,
                    projectId: storedSession?.projectId || '',
                    status: 'running',
                    startedAt: storedSession?.startedAt ?? Date.now(),
                });
                setWaitingForResume(false);

                // Phase 1: Generate Moodboard
                if (!isMounted) return;
                setPhase('moodboard');
                await new Promise(r => setTimeout(r, 800)); // Simulate processing

                const projectData = buildProjectData();

                // Moodboard generation expects OnboardingProfile-like object
                const moodboard = generateMoodboardV2(profile, {
                    ...projectData,
                    projectName: projectData.name || '',
                } as any);
                setGeneratedMoodboard(moodboard);

                // Phase 2: Create Project
                if (!isMounted) return;
                setPhase('project');

                const project = await createProject({
                    ...projectData,
                    moodboard,
                } as any);
                setCreatedProjectId(project.id);

                // Phase 3: Generate Tear Sheet
                if (!isMounted) return;
                setPhase('tear-sheet');
                await new Promise(r => setTimeout(r, 600));

                const contextSnapshot = buildProjectContextSnapshot();

                // Build Tear Sheet content from profile
                const contextRevision: ProjectContextRevision = {
                    id: crypto.randomUUID(),
                    version: 1,
                    createdAt: new Date().toISOString(),
                    summary: 'Initial Draft from Guided Setup',
                    status: 'draft',
                    createdFrom: 'onboarding',
                    scopeImpact: 'Medium',
                    data: contextSnapshot,
                    impact: {
                        affectedSections: buildAffectedSections(profile),
                        costEstimation: estimateCost(profile),
                        workflowChanges: buildWorkflowChanges(profile),
                    },
                };

                // Persist Tear Sheet to localStorage
                storageAdapter.saveContextRevisions(project.id, [contextRevision]);

                // Store extended profile for editability
                storageAdapter.saveOnboardingProfile(project.id, profile);

                // Phase 4: Complete
                if (!isMounted) return;
                setPhase('complete');
                await new Promise(r => setTimeout(r, 400));

                saveGenerationSessionById(generationSessionId, {
                    id: generationSessionId,
                    projectId: project.id,
                    status: 'complete',
                    startedAt: storedSession?.startedAt ?? Date.now(),
                    completedAt: Date.now(),
                });

                // Navigate to Project Context for confirmation
                navigate(`/p/${project.id}/context?mode=draft&from=onboarding`);

            } catch (err) {
                console.error('Generation failed:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'An unexpected error occurred');
                }
            }
        };

        generate();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleRetry = () => {
        setError(null);
        setStep(profile.isImportFlow ? 'import' : 'context');
    };

    const handleResume = () => {
        setWaitingForResume(false);
        setPhase('starting');
        setError(null);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('generationSessionId', generationSessionId);
        navigate(`/new?${nextParams.toString()}`, { replace: true });
    };

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                    <span className="text-red-500 text-xl">!</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
                        Generation Failed
                    </h2>
                    <p className="text-zinc-500 max-w-md">{error}</p>
                </div>
                <Button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Open previous step
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-500">

            {/* Animated Icon */}
            <div className="relative">
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                    <Sparkles
                        size={48}
                        className="text-amber-500 animate-pulse"
                    />
                </div>
                <div className="absolute -inset-4 bg-amber-200/20 rounded-full blur-xl animate-pulse" />
            </div>

            {/* Status */}
            <div className="space-y-4">
                <h1 className="text-xl font-semibold tracking-tighter text-text-primary leading-none">
                    {phase === 'complete' ? 'Provisioning complete' : 'Project initiation'}
                </h1>
                <p className="text-xl text-text-secondary font-medium italic font-serif">
                    {PHASE_LABELS[phase]}
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-6">
                <ProgressIcon
                    icon={Palette}
                    label="Moodboard"
                    status={getStepStatus('moodboard', phase)}
                />
                <div className="w-12 h-px bg-[#1A1A1A]/10" />
                <ProgressIcon
                    icon={FileText}
                    label="Project Brief"
                    status={getStepStatus('tear-sheet', phase)}
                />
            </div>

            {/* Loading Indicator */}
            {phase !== 'complete' && (
                <Loader2 size={24} className="text-zinc-400 animate-spin" />
            )}

            {/* Helper text */}
            <p className="text-xs text-text-soft font-semibold max-w-xs leading-loose">
                Assembling your workspace.<br/>
                Final review and confirmation required before launch.
            </p>

            {waitingForResume && (
                <Button
                    onClick={handleResume}
                    className="px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Resume provisioning
                </Button>
            )}
        </div>
    );
};

// Helper: Progress icon component
function ProgressIcon({
    icon: Icon,
    label,
    status
}: {
    icon: React.ElementType;
    label: string;
    status: 'pending' | 'active' | 'complete';
}) {
    return (
        <div className={`flex flex-col items-center gap-3 transition-all duration-700 ${status === 'pending' ? 'opacity-20' : 'opacity-100'
            }`}>
            <div className={`p-4 rounded-full transition-all duration-700 shadow-2xl ${status === 'complete'
                ? 'bg-[#1A1A1A] text-white shadow-[#1A1A1A]/20'
                : status === 'active'
                    ? 'bg-zinc-600 text-white shadow-zinc-500/30 animate-pulse'
                    : 'bg-white border border-[#1A1A1A]/5 text-text-soft'
                }`}>
                <Icon size={24} strokeWidth={status === 'complete' ? 3 : 2} />
            </div>
            <span className="text-xs font-semibold text-text-primary">{label}</span>
        </div>
    );
}

// Helper: Determine step status
function getStepStatus(
    step: 'moodboard' | 'tear-sheet',
    currentPhase: GenerationPhase
): 'pending' | 'active' | 'complete' {
    const order: GenerationPhase[] = ['starting', 'moodboard', 'project', 'tear-sheet', 'complete'];
    const currentIndex = order.indexOf(currentPhase);
    const stepIndex = order.indexOf(step);

    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex || (step === 'moodboard' && currentPhase === 'project')) return 'active';
    return 'pending';
}

// Helper: Build affected sections from profile
function buildAffectedSections(profile: ReturnType<typeof useOnboardingStore.getState>['profile']): string[] {
    const sections = ['Project Brief', 'Visual Direction'];

    if (profile.context.creativeGoals.includes('brand-identity')) {
        sections.push('Brand Guidelines');
    }
    if (profile.context.creativeGoals.includes('marketing-campaign')) {
        sections.push('Campaign Assets');
    }
    const projectIntent = profile.projectIntent;
    if (projectIntent?.useCase === 'designer-handoff') {
        sections.push('Design Specifications');
    }

    return sections;
}

// Helper: Estimate cost from profile
function estimateCost(profile: ReturnType<typeof useOnboardingStore.getState>['profile']): string {
    const projectIntent = profile.projectIntent;
    const complexity = profile.visualDirection.personality.length +
        profile.visualDirection.imageryTypes.length +
        (projectIntent?.detailLevel || 3);

    if (complexity <= 5) return '$ - Simple Start';
    if (complexity <= 8) return '$$ - Moderate Investment';
    return '$$$ - Comprehensive Setup';
}

// Helper: Build workflow changes
function buildWorkflowChanges(profile: ReturnType<typeof useOnboardingStore.getState>['profile']): string[] {
    const changes: string[] = [];
    const projectIntent = profile.projectIntent;

    if (profile.context.aiWorkStyle === 'full-automation') {
        changes.push('Automated generation enabled');
    }
    if (profile.context.aiWorkStyle === 'suggest-then-approve') {
        changes.push('Approval queue active');
    }
    if (projectIntent?.useCase === 'client-presentation') {
        changes.push('Export mode configured');
    }
    if (profile.visualDirection.existingAssets === 'full-brand-guidelines') {
        changes.push('Brand asset integration pending');
    }

    return changes.length > 0 ? changes : ['Standard workflow'];
}
