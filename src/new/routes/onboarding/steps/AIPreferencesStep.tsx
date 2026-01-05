import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    QUALITY_PRIORITY_OPTIONS,
    DATA_SENSITIVITY_OPTIONS,
    QualityCostLatencyPriority,
    DataSensitivity,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-12">
            {/* Progress */}
            <OnboardingProgress currentStep="ai-preferences" />

            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span className="text-xs font-semibold text-text-soft">Cognitive Architecture</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tighter text-text-primary leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-normal text-zinc-500">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-text-secondary font-medium italic max-w-lg leading-relaxed">
                    &quot;{stepMeta.description}&quot;
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-12">

                {/* Smart Mode Status */}
                <section className="bg-[var(--color-ink)] p-8 rounded-[24px] text-white shadow-2xl flex items-center justify-between group hover:scale-[1.02] transition-transform duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-zinc-600 rounded-2xl flex items-center justify-center flex-shrink-0 -rotate-3 group-hover:rotate-0 transition-transform">
                            <Zap size={28} strokeWidth={3} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-zinc-200">Smart Mode Active</h3>
                                <div className="px-3 py-1 bg-white/10 text-xs font-semibold rounded-full backdrop-blur-sm">
                                    System Default
                                </div>
                            </div>
                            <p className="text-sm opacity-70 font-medium italic mt-1 leading-tight">&quot;Codra will automatically manage model selection and cost-efficiency for you.&quot;</p>
                        </div>
                    </div>
                </section>

                {/* Q1: Quality Priority */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-text-soft">Production Priority</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {QUALITY_PRIORITY_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateAIPreferences({ qualityPriority: option.id as QualityCostLatencyPriority })}
                                className={`p-6 text-left border rounded-[24px] transition-all duration-500 ${aiPreferences.qualityPriority === option.id
                                    ? 'border-zinc-400 bg-zinc-200/40 shadow-2xl shadow-zinc-500/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-semibold ${aiPreferences.qualityPriority === option.id ? 'text-zinc-500' : 'text-text-primary'}`}>
                                        {option.label}
                                    </span>
                                    {aiPreferences.qualityPriority === option.id && <Check size={14} strokeWidth={4} className="text-zinc-500" />}
                                </div>
                                <p className="text-xs text-text-soft font-medium leading-relaxed">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q4: Data Sensitivity */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-text-soft">Data Sensitivity Check</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {DATA_SENSITIVITY_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateAIPreferences({ dataSensitivity: option.id as DataSensitivity })}
                                className={`p-6 text-left border rounded-[24px] transition-all duration-500 ${aiPreferences.dataSensitivity === option.id
                                    ? 'border-zinc-400 bg-zinc-200/40 shadow-2xl shadow-zinc-500/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-semibold ${aiPreferences.dataSensitivity === option.id ? 'text-zinc-500' : 'text-text-primary'}`}>
                                        {option.label}
                                    </span>
                                    {aiPreferences.dataSensitivity === option.id && <Check size={14} strokeWidth={4} className="text-zinc-500" />}
                                </div>
                                <p className="text-xs text-text-soft font-medium leading-relaxed">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ink)]/5">
                <Button
                    variant="ghost"
                    onClick={() => setStep(prevStep)}
                    leftIcon={<ArrowLeft size={16} strokeWidth={3} />}
                    className="text-xs font-semibold text-text-soft hover:text-text-primary transition-colors"
                >
                    Open previous step
                </Button>
                <span className="text-xs font-medium italic font-serif text-text-soft">
                    {stepMeta.helperText}
                </span>
                <Button
                    variant="primary"
                    onClick={() => setStep(nextStep)}
                    disabled={!canProceed}
                    rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                    className="px-8 py-4 text-xs font-semibold shadow-2xl active:scale-95"
                >
                    Define Budget
                </Button>
            </div>
        </div>
    );
};
