import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store';
import { createProject } from '../../../../domain/projects';
import { generateMoodboardV2 } from '../moodboardGeneratorV2';
import { TearSheetRevision } from '../../../../domain/types';
import { Loader2, Sparkles, FileText, Palette } from 'lucide-react';

type GenerationPhase = 'starting' | 'moodboard' | 'tear-sheet' | 'project' | 'complete';

const PHASE_LABELS: Record<GenerationPhase, string> = {
    starting: 'Initializing...',
    moodboard: 'Generating Moodboard v1...',
    'tear-sheet': 'Creating Tear Sheet v1...',
    project: 'Setting up project workspace...',
    complete: 'Ready for review',
};

export const GeneratingStep = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
        let isMounted = true;

        const generate = async () => {
            try {
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
                const tearSheetRevision: TearSheetRevision = {
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
                localStorage.setItem(
                    `codra:tearSheet:${project.id}`,
                    JSON.stringify([tearSheetRevision])
                );

                // Store extended profile for editability
                localStorage.setItem(
                    `codra:onboardingProfile:${project.id}`,
                    JSON.stringify(profile)
                );

                // Phase 4: Complete
                if (!isMounted) return;
                setPhase('complete');
                await new Promise(r => setTimeout(r, 400));

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

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                    <span className="text-red-500 text-2xl">!</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
                        Generation Failed
                    </h2>
                    <p className="text-zinc-500 max-w-md">{error}</p>
                </div>
                <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    Go Back and Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-500">

            {/* Animated Icon */}
            <div className="relative">
                <div className="p-6 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 rounded-full">
                    <Sparkles
                        size={48}
                        className="text-amber-500 animate-pulse"
                    />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-200/20 via-rose-200/20 to-amber-200/20 rounded-full blur-xl animate-pulse" />
            </div>

            {/* Status */}
            <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] leading-none">
                    {phase === 'complete' ? 'Production Ready' : 'Project Initiation'}
                </h1>
                <p className="text-xl text-[#5A5A5A] font-medium italic font-serif">
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
                    label="Tear Sheet"
                    status={getStepStatus('tear-sheet', phase)}
                />
            </div>

            {/* Loading Indicator */}
            {phase !== 'complete' && (
                <Loader2 size={24} className="text-zinc-400 animate-spin" />
            )}

            {/* Helper text */}
            <p className="text-[10px] text-[#8A8A8A] font-black uppercase tracking-[0.2em] max-w-xs leading-loose">
                Assembling editorial foundation.<br/>
                Final review and confirmation required before launch.
            </p>
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
            <div className={`p-5 rounded-full transition-all duration-700 shadow-2xl ${status === 'complete'
                ? 'bg-[#1A1A1A] text-white shadow-[#1A1A1A]/20'
                : status === 'active'
                    ? 'bg-[#FF4D4D] text-white shadow-[#FF4D4D]/30 animate-pulse'
                    : 'bg-white border border-[#1A1A1A]/5 text-[#8A8A8A]'
                }`}>
                <Icon size={24} strokeWidth={status === 'complete' ? 3 : 2} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">{label}</span>
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
    if (profile.tearSheetIntent.useCase === 'designer-handoff') {
        sections.push('Design Specifications');
    }

    return sections;
}

// Helper: Estimate cost from profile
function estimateCost(profile: ReturnType<typeof useOnboardingStore.getState>['profile']): string {
    const complexity = profile.visualDirection.personality.length +
        profile.visualDirection.imageryTypes.length +
        (profile.tearSheetIntent.detailLevel || 3);

    if (complexity <= 5) return '$ - Simple Start';
    if (complexity <= 8) return '$$ - Moderate Investment';
    return '$$$ - Comprehensive Setup';
}

// Helper: Build workflow changes
function buildWorkflowChanges(profile: ReturnType<typeof useOnboardingStore.getState>['profile']): string[] {
    const changes: string[] = [];

    if (profile.context.aiWorkStyle === 'full-automation') {
        changes.push('Automated generation enabled');
    }
    if (profile.context.aiWorkStyle === 'suggest-then-approve') {
        changes.push('Approval queue active');
    }
    if (profile.tearSheetIntent.useCase === 'client-presentation') {
        changes.push('Export mode configured');
    }
    if (profile.visualDirection.existingAssets === 'full-brand-guidelines') {
        changes.push('Brand asset integration pending');
    }

    return changes.length > 0 ? changes : ['Standard workflow'];
}
