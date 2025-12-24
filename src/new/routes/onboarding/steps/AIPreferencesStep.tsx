import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    QUALITY_PRIORITY_OPTIONS,
    DATA_SENSITIVITY_OPTIONS,
    QualityCostLatencyPriority,
    DataSensitivity,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export const AIPreferencesStep = () => {
    const {
        profile,
        updateAIPreferences,
        setStep,
    } = useOnboardingStore();
    const state = useOnboardingStore();

    const { aiPreferences } = profile;
    const stepMeta = STEP_METADATA['ai-preferences'];
    const canProceed = canProceedFromStep('ai-preferences', state);

    // Determine previous step based on flow
    const prevStep = profile.isImportFlow ? 'import' : 'context';
    // Determine next step based on flow
    const nextStep = 'budget';

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
            {/* Progress */}
            <OnboardingProgress currentStep="ai-preferences" />

            {/* Header */}
            <header className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stepMeta.title}
                </h1>
                <p className="text-lg text-zinc-500 font-light max-w-lg">
                    {stepMeta.description}
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-12">

                {/* Smart Mode Status */}
                <section className="bg-zinc-900 dark:bg-zinc-100 p-6 rounded-sm text-white dark:text-zinc-900 border border-transparent shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold uppercase tracking-widest">Smart Mode Active</h3>
                                <div className="px-2 py-0.5 bg-indigo-500 text-[10px] font-black uppercase rounded-full text-white">Default</div>
                            </div>
                            <p className="text-xs opacity-70 mt-1">Codra will automatically manage model selection, latency, and cost-efficiency for you.</p>
                        </div>
                        <Check size={24} className="opacity-50" />
                    </div>
                </section>

                {/* Q1: Quality Priority */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        What matters most for your AI outputs?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {QUALITY_PRIORITY_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updateAIPreferences({ qualityPriority: option.id as QualityCostLatencyPriority })}
                                className={`p-5 text-left border rounded-sm transition-all duration-200 ${aiPreferences.qualityPriority === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 shadow-sm'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-semibold text-sm ${aiPreferences.qualityPriority === option.id ? 'text-zinc-900 dark:text-zinc-100' : ''}`}>{option.label}</span>
                                    {aiPreferences.qualityPriority === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs opacity-70 leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q4: Data Sensitivity */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Data Sensitivity Check
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DATA_SENSITIVITY_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updateAIPreferences({ dataSensitivity: option.id as DataSensitivity })}
                                className={`p-5 text-left border rounded-sm transition-all duration-200 ${aiPreferences.dataSensitivity === option.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 shadow-sm'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-semibold text-sm ${aiPreferences.dataSensitivity === option.id ? 'text-zinc-900 dark:text-zinc-100' : ''}`}>{option.label}</span>
                                    {aiPreferences.dataSensitivity === option.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs opacity-70 leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-900">
                <button
                    onClick={() => setStep(prevStep)}
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
                        disabled={!canProceed}
                        className="flex items-center gap-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed rounded-sm shadow-lg"
                    >
                        Continue
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
