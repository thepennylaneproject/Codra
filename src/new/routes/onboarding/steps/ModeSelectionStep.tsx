import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore, STEP_METADATA } from '../store';
import { createProject } from '../../../../domain/projects';
import { TearSheetRevision, OnboardingProfile } from '../../../../domain/types';
import { ProjectType, PROJECT_TYPE_OPTIONS } from '../../../../domain/onboarding-types';
import { ArrowRight, Loader2, Zap, Layers } from 'lucide-react';
import { useSettingsStore } from '../../../../lib/store/useSettingsStore';
import { Button } from '../../../components/Button';

const MANUAL_DEFAULT_PROFILE: OnboardingProfile = {
    projectName: 'Untitled Project',
    description: '',
    audience: '',
    goals: [],
    boundaries: [],
    budgetPolicy: {
        maxCostPerRun: 50,
        dailyLimit: 500,
        approvalRequired: true,
    },
    editorialPreferences: {
        tone: 'neutral',
        pacing: 'steady',
    },
    selectedDesks: [],
    moodboard: [],
};

export const ModeSelectionStep = () => {
    const { setStep, setProjectType, setManualSetup, setImportFlow } = useOnboardingStore();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedType, setSelectedType] = useState<ProjectType | null>(null);

    const handleProjectTypeSelect = (type: ProjectType) => {
        setSelectedType(type);
    };

    const handleContinue = async () => {
        if (!selectedType) return;

        setIsCreating(true);
        setProjectType(selectedType);
        setManualSetup(false);
        setImportFlow(false);

        try {
            // Create project with selected type
            const project = await createProject({
                ...MANUAL_DEFAULT_PROFILE,
                projectName: `New ${PROJECT_TYPE_OPTIONS.find(o => o.id === selectedType)?.label || 'Project'}`,
                description: `A ${selectedType} project`,
            });

            // Initialize draft Tear Sheet
            const initialRevision: TearSheetRevision = {
                id: crypto.randomUUID(),
                version: 1,
                createdAt: new Date().toISOString(),
                summary: `${selectedType} project - ready for prompt generation`,
                status: 'approved', // Pre-approved since we're skipping the abstract steps
                createdFrom: 'manual',
                scopeImpact: 'Low',
                data: {
                    identity: {
                        name: project.name,
                        summary: `A ${selectedType} project`,
                        type: project.type,
                    },
                    deliverables: [],
                    audience: { primary: 'General', context: {} },
                    brand: {},
                    success: {},
                    guardrails: {},
                },
            };
            localStorage.setItem(`codra:tearSheet:${project.id}`, JSON.stringify([initialRevision]));

            // Route directly to the Spread (prompt-first workspace)
            navigate(`/p/${project.id}/spread`);
        } catch (e) {
            console.error('Failed to create project:', e);
            setIsCreating(false);
        }
    };

    const handleImportProject = () => {
        setManualSetup(false);
        setImportFlow(true);
        setStep('import');
    };

    const handleSurgicalIntake = async () => {
        if (!selectedType) return;
        setIsCreating(true);

        // Use global settings
        const settings = useSettingsStore.getState();

        try {
            const project = await createProject({
                ...MANUAL_DEFAULT_PROFILE,
                projectName: `New ${PROJECT_TYPE_OPTIONS.find(o => o.id === selectedType)?.label || 'Project'}`,
                description: `Surgical intake for ${selectedType}`,
                budgetPolicy: {
                    maxCostPerRun: settings.budgetDefaults.budgetMode === 'performance' ? 100 : 50,
                    dailyLimit: 500,
                    approvalRequired: true
                }
            });

            // Initialize minimal revision
            const initialRevision: TearSheetRevision = {
                id: crypto.randomUUID(),
                version: 1,
                createdAt: new Date().toISOString(),
                summary: `Surgical intake: ${selectedType}`,
                status: 'approved',
                createdFrom: 'manual',
                scopeImpact: 'Low',
                data: {
                    identity: {
                        name: project.name,
                        summary: `Surgical intake for ${selectedType}`,
                        type: project.type,
                    },
                    deliverables: [],
                    audience: { primary: 'General', context: {} },
                    brand: {},
                    success: {},
                    guardrails: {},
                },
            };
            localStorage.setItem(`codra:tearSheet:${project.id}`, JSON.stringify([initialRevision]));

            navigate(`/p/${project.id}/spread`);
        } catch (e) {
            console.error('Failed to create project:', e);
            setIsCreating(false);
        }
    };

    const stepMeta = STEP_METADATA.mode;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-coral)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">System Entry</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[var(--color-ink)] leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-light text-[var(--color-brand-coral)]">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-[var(--color-ink-light)] font-medium italic max-w-lg leading-relaxed">
                    "{stepMeta.description}"
                </p>
            </header>

            {/* Project Type Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PROJECT_TYPE_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleProjectTypeSelect(option.id)}
                        className={`group relative p-8 text-left border transition-all duration-500 rounded-[28px] flex flex-col gap-4 min-h-[180px] ${selectedType === option.id
                            ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                            : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white hover:shadow-xl'
                            }`}
                    >
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-500 origin-left">{option.icon}</span>
                        <div>
                            <h3 className={`text-lg font-black tracking-tight uppercase ${selectedType === option.id
                                ? 'text-[var(--color-brand-coral)]'
                                : 'text-[var(--color-ink)]'
                                }`}>
                                {option.label}
                            </h3>
                            <p className="text-xs text-[var(--color-ink-muted)] font-medium leading-relaxed mt-2">
                                {option.description}
                            </p>
                        </div>
                        {selectedType === option.id && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-[var(--color-brand-coral)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--color-brand-coral)]/20 animate-in zoom-in-50 duration-300">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Primary Actions - Quick Launch First */}
            <div className="space-y-6">
                {/* Quick Launch - THE PRIMARY ACTION */}
                <div className="bg-white border border-[var(--color-ink)]/5 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="p-5 rounded-[24px] bg-[var(--color-ink)] text-white shadow-2xl group-hover:bg-[var(--color-brand-coral)] transition-colors duration-500">
                            <Zap size={32} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-[var(--color-ink)] flex items-center justify-center md:justify-start gap-3">
                                Quick Launch
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[var(--color-brand-coral)] text-white rounded-full">Automated</span>
                            </h3>
                            <p className="text-sm text-[var(--color-ink-muted)] font-medium mt-2 mb-6">
                                Bypass guided steps. Uses your smart defaults for immediate production.
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSurgicalIntake}
                                disabled={!selectedType || isCreating}
                                leftIcon={isCreating ? <Loader2 className="animate-spin" size={16} /> : undefined}
                                rightIcon={!isCreating ? <ArrowRight size={16} strokeWidth={3} /> : undefined}
                                className="px-10 py-5 shadow-2xl"
                            >
                                {isCreating ? 'Initiating...' : 'Start Production'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Secondary: Guided Setup, Import & Templates */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={handleContinue}
                        disabled={!selectedType || isCreating}
                        className="flex-1"
                    >
                        Guided Consultation
                        <span className="text-[9px] opacity-40 lowercase italic font-serif ml-2">full control</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => navigate('/blueprints')}
                        leftIcon={<Layers size={14} />}
                        className="flex-1 hover:text-[var(--color-brand-coral)]"
                    >
                        Browse Templates
                        <span className="text-[9px] opacity-40 lowercase italic font-serif ml-2">8 blueprints</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={handleImportProject}
                        className="flex-1"
                    >
                        Import Workflow
                        <span className="text-[9px] opacity-40 lowercase italic font-serif ml-2">JSON / ZIP</span>
                    </Button>
                </div>
            </div>

            {/* Helper Text */}
            <p className="text-sm text-zinc-400">
                {stepMeta.helperText}
            </p>
        </div>
    );
};
