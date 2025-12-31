import { useOnboardingStore, STEP_METADATA } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    AUTONOMY_OPTIONS,
    APPROVAL_REQUIRED_OPTIONS,
    MAX_STEPS_OPTIONS,
    UNACCEPTABLE_MISTAKES_OPTIONS,
    DATA_ACCESS_OPTIONS,
    CONFLICT_RESOLUTION_OPTIONS,
    AutonomyLevel,
    ApprovalRequired,
    MaxStepsBeforePause,
    RiskTolerance,
    UnacceptableMistake,
    DataAccessMode,
    ConflictResolution,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/Button';

export const PermissionsStep = () => {
    const {
        profile,
        updatePermissions,
        setStep,
    } = useOnboardingStore();

    const { permissions } = profile;
    const stepMeta = STEP_METADATA['permissions'];

    // Determine next step based on flow
    const nextStep = profile.isImportFlow ? 'generating' : 'visual';

    const toggleApprovalRequired = (item: ApprovalRequired) => {
        const current = permissions.alwaysRequireApproval;
        if (current.includes(item)) {
            updatePermissions({ alwaysRequireApproval: current.filter(i => i !== item) });
        } else {
            updatePermissions({ alwaysRequireApproval: [...current, item] });
        }
    };

    const toggleUnacceptable = (item: UnacceptableMistake) => {
        const current = permissions.neverAcceptableMistakes;
        if (current.includes(item)) {
            updatePermissions({ neverAcceptableMistakes: current.filter(i => i !== item) });
        } else {
            updatePermissions({ neverAcceptableMistakes: [...current, item] });
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
            {/* Progress */}
            <OnboardingProgress currentStep="permissions" />

            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-coral)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">Security & Governance</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[var(--color-ink)] leading-none">
                    Define the <br />
                    <span className="italic font-serif font-light text-[var(--color-brand-coral)]">Chain of Command</span>
                </h1>
                <p className="text-xl text-[var(--color-ink-light)] font-medium italic max-w-lg leading-relaxed">
                    "{stepMeta.description}"
                </p>
            </header>

            {/* Optional notice */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-sm">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <strong>This step is optional.</strong> We'll use sensible defaults if you skip ahead.
                    You can fine-tune these in project settings anytime.
                </p>
            </div>

            {/* Questions */}
            <div className="space-y-12">

                {/* Q1: Default Autonomy Level */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Default Agent Autonomy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {AUTONOMY_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ defaultAutonomy: option.id as AutonomyLevel })}
                                className={`p-6 text-left border rounded-[24px] transition-all duration-500 ${permissions.defaultAutonomy === option.id
                                    ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-black text-[10px] uppercase tracking-widest ${permissions.defaultAutonomy === option.id ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{option.label}</span>
                                    {permissions.defaultAutonomy === option.id && <Check size={14} strokeWidth={4} className="text-[var(--color-brand-coral)]" />}
                                </div>
                                <p className="text-[11px] text-[var(--color-ink-muted)] font-medium leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q2: Always Require Approval */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Strategic Gates (Required Approval)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {APPROVAL_REQUIRED_OPTIONS.map(option => {
                            const isSelected = permissions.alwaysRequireApproval.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleApprovalRequired(option.id)}
                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-md'
                                        : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Q3: Max Steps Before Pause */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Sequential Velocity Limit
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {MAX_STEPS_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ maxStepsBeforePause: option.id as MaxStepsBeforePause })}
                                className={`p-6 text-center border rounded-[24px] transition-all duration-500 ${permissions.maxStepsBeforePause === option.id
                                    ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <span className={`font-black text-xs ${permissions.maxStepsBeforePause === option.id ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{option.label}</span>
                                <p className="text-[10px] text-[var(--color-ink-muted)] font-medium mt-1 uppercase tracking-widest leading-tight">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q4: Risk Tolerance (1-5 slider) */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Risk Tolerance Index
                    </label>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)] w-24">Conservative</span>
                        <div className="flex-1 flex gap-3">
                            {([1, 2, 3, 4, 5] as RiskTolerance[]).map(level => (
                                <button
                                    key={level}
                                    onClick={() => updatePermissions({ riskTolerance: level })}
                                    className={`flex-1 h-14 rounded-2xl transition-all duration-500 flex items-center justify-center font-black text-sm ${permissions.riskTolerance === level
                                        ? 'bg-[var(--color-brand-coral)] text-white shadow-xl scale-110 z-10'
                                        : 'bg-[var(--color-ink)]/5 hover:bg-[var(--color-ink)]/10 text-[var(--color-ink-muted)]'
                                        }`}
                                >
                                    <span className="font-black">{level}</span>
                                </button>
                            ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)] w-24 text-right">Bold</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-ink-muted)] font-medium italic text-center">
                        {permissions.riskTolerance <= 2
                            ? '"Ultra-conservative: avoid any changes that might fail."'
                            : permissions.riskTolerance === 3
                                ? '"Balanced: make safe improvements."'
                                : '"Bold: willing to propose significant changes."'
                        }
                    </p>
                </section>

                {/* Q5: Unacceptable Mistakes */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-coral)]">
                        Zero Tolerance Policy
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {UNACCEPTABLE_MISTAKES_OPTIONS.map(option => {
                            const isSelected = permissions.neverAcceptableMistakes.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleUnacceptable(option.id)}
                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 text-[var(--color-brand-coral)] shadow-lg'
                                        : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Q6: Data Access Mode */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Data Privacy & Access
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {DATA_ACCESS_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ dataAccessMode: option.id as DataAccessMode })}
                                className={`p-6 text-left border rounded-[24px] transition-all duration-500 ${permissions.dataAccessMode === option.id
                                    ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-black text-[10px] uppercase tracking-widest ${permissions.dataAccessMode === option.id ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{option.label}</span>
                                    {permissions.dataAccessMode === option.id && <Check size={14} strokeWidth={4} className="text-[var(--color-brand-coral)]" />}
                                </div>
                                <p className="text-[11px] text-[var(--color-ink-muted)] font-medium leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q7: Conflict Resolution */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Conflict Protocol
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {CONFLICT_RESOLUTION_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ conflictResolution: option.id as ConflictResolution })}
                                className={`p-6 text-left border rounded-[24px] transition-all duration-500 ${permissions.conflictResolution === option.id
                                    ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-black text-[10px] uppercase tracking-widest ${permissions.conflictResolution === option.id ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{option.label}</span>
                                    {permissions.conflictResolution === option.id && <Check size={14} strokeWidth={4} className="text-[var(--color-brand-coral)]" />}
                                </div>
                                <p className="text-[11px] text-[var(--color-ink-muted)] font-medium leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ink)]/5">
                <Button
                    variant="ghost"
                    onClick={() => setStep('budget')}
                    leftIcon={<ArrowLeft size={16} strokeWidth={3} />}
                    className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                    Financials
                </Button>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-medium italic font-serif text-[var(--color-ink-muted)]">
                        {stepMeta.helperText}
                    </span>
                    <Button
                        variant="primary"
                        onClick={() => setStep(nextStep)}
                        rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                        className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95"
                    >
                        Initiate Strategy
                    </Button>
                </div>
            </div>
        </div>
    );
};
