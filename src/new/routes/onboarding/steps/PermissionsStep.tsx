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
import { ArrowLeft, ArrowRight, Check, Shield } from 'lucide-react';

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
            <header className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                        <Shield size={24} className="text-zinc-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
                            {stepMeta.title}
                        </h1>
                        <p className="text-lg text-zinc-500 font-light">
                            {stepMeta.description}
                        </p>
                    </div>
                </div>
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        How autonomous should the AI be by default?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {AUTONOMY_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ defaultAutonomy: option.id as AutonomyLevel })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${permissions.defaultAutonomy === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {permissions.defaultAutonomy === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q2: Always Require Approval */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Which actions should ALWAYS require your approval?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {APPROVAL_REQUIRED_OPTIONS.map(option => {
                            const isSelected = permissions.alwaysRequireApproval.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleApprovalRequired(option.id)}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        How many steps can the AI take before pausing to check in?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {MAX_STEPS_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ maxStepsBeforePause: option.id as MaxStepsBeforePause })}
                                className={`p-4 text-center border rounded-sm transition-all duration-200 ${permissions.maxStepsBeforePause === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q4: Risk Tolerance (1-5 slider) */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        How risk-tolerant should this agent be?
                    </label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-400 w-24">Conservative</span>
                        <div className="flex-1 flex gap-2">
                            {([1, 2, 3, 4, 5] as RiskTolerance[]).map(level => (
                                <button
                                    key={level}
                                    onClick={() => updatePermissions({ riskTolerance: level })}
                                    className={`flex-1 h-12 rounded-sm transition-all duration-200 flex items-center justify-center ${permissions.riskTolerance === level
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500'
                                        }`}
                                >
                                    <span className="font-medium">{level}</span>
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-zinc-400 w-24 text-right">Bold</span>
                    </div>
                    <p className="text-xs text-zinc-400 text-center">
                        {permissions.riskTolerance <= 2
                            ? 'Ultra-conservative: avoid any changes that might fail'
                            : permissions.riskTolerance === 3
                                ? 'Balanced: make safe improvements'
                                : 'Bold: willing to propose significant changes'
                        }
                    </p>
                </section>

                {/* Q5: Unacceptable Mistakes */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Which mistakes are NEVER acceptable?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {UNACCEPTABLE_MISTAKES_OPTIONS.map(option => {
                            const isSelected = permissions.neverAcceptableMistakes.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleUnacceptable(option.id)}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/30 dark:text-red-300'
                                        : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        How should we handle your data?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {DATA_ACCESS_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ dataAccessMode: option.id as DataAccessMode })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${permissions.dataAccessMode === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {permissions.dataAccessMode === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q7: Conflict Resolution */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        If instructions conflict, what should the AI do?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {CONFLICT_RESOLUTION_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updatePermissions({ conflictResolution: option.id as ConflictResolution })}
                                className={`p-4 text-left border rounded-sm transition-all duration-200 ${permissions.conflictResolution === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                                    {permissions.conflictResolution === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs text-zinc-500">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-900">
                <button
                    onClick={() => setStep('budget')}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-400">
                        {stepMeta.helperText}
                    </span>
                    <button
                        onClick={() => setStep(nextStep)}
                        className="flex items-center gap-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity rounded-sm"
                    >
                        Continue
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
