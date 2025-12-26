import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore, STEP_METADATA } from '../store';
import { createProject } from '../../../../domain/projects';
import { TearSheetRevision, OnboardingProfile } from '../../../../domain/types';
import { ProjectType, PROJECT_TYPE_OPTIONS } from '../../../../domain/onboarding-types';
import { ArrowRight, Loader2, Zap, Layers } from 'lucide-react';
import { useSettingsStore } from '../../../../lib/store/useSettingsStore';

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
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8A8A]">System Entry</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-light text-[#FF4D4D]">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-[#5A5A5A] font-medium italic max-w-lg leading-relaxed">
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
                            ? 'border-[#FF4D4D] bg-[#FF4D4D]/5 shadow-2xl shadow-[#FF4D4D]/10'
                            : 'border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 bg-white hover:shadow-xl'
                            }`}
                    >
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-500 origin-left">{option.icon}</span>
                        <div>
                            <h3 className={`text-lg font-black tracking-tight uppercase ${selectedType === option.id
                                ? 'text-[#FF4D4D]'
                                : 'text-[#1A1A1A]'
                                }`}>
                                {option.label}
                            </h3>
                            <p className="text-xs text-[#8A8A8A] font-medium leading-relaxed mt-2">
                                {option.description}
                            </p>
                        </div>
                        {selectedType === option.id && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-[#FF4D4D] rounded-full flex items-center justify-center shadow-lg shadow-[#FF4D4D]/20 animate-in zoom-in-50 duration-300">
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
                <div className="bg-white border border-[#1A1A1A]/5 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="p-5 rounded-[24px] bg-[#1A1A1A] text-white shadow-2xl group-hover:bg-[#FF4D4D] transition-colors duration-500">
                            <Zap size={32} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-[#1A1A1A] flex items-center justify-center md:justify-start gap-3">
                                Quick Launch
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#FF4D4D] text-white rounded-full">Automated</span>
                            </h3>
                            <p className="text-sm text-[#8A8A8A] font-medium mt-2 mb-6">
                                Bypass guided steps. Uses your smart defaults for immediate production.
                            </p>
                            <button
                                onClick={handleSurgicalIntake}
                                disabled={!selectedType || isCreating}
                                className="px-10 py-5 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FF4D4D] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl active:scale-95 flex items-center justify-center mx-auto md:mx-0 gap-3"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Initiating...
                                    </>
                                ) : (
                                    <>
                                        Start Production
                                        <ArrowRight size={16} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Secondary: Guided Setup, Import & Templates */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleContinue}
                        disabled={!selectedType || isCreating}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest border border-[#1A1A1A]/10 rounded-2xl text-[#8A8A8A] hover:bg-white hover:text-[#1A1A1A] hover:border-[#1A1A1A]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Guided Consultation
                        <span className="text-[9px] opacity-40 lowercase italic font-serif">full control</span>
                    </button>
                    <button
                        onClick={() => navigate('/blueprints')}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest border border-[#1A1A1A]/10 rounded-2xl text-[#8A8A8A] hover:bg-white hover:text-[#FF4D4D] hover:border-[#FF4D4D]/20 transition-all group"
                    >
                        <Layers size={14} className="group-hover:text-[#FF4D4D]" />
                        Browse Templates
                        <span className="text-[9px] opacity-40 lowercase italic font-serif">8 blueprints</span>
                    </button>
                    <button
                        onClick={handleImportProject}
                        className="flex-1 flex items-center justify-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest border border-[#1A1A1A]/10 rounded-2xl text-[#8A8A8A] hover:bg-white hover:text-[#1A1A1A] hover:border-[#1A1A1A]/20 transition-all"
                    >
                        Import Workflow
                        <span className="text-[9px] opacity-40 lowercase italic font-serif">JSON / ZIP</span>
                    </button>
                </div>
            </div>

            {/* Helper Text */}
            <p className="text-sm text-zinc-400">
                {stepMeta.helperText}
            </p>
        </div>
    );
};
