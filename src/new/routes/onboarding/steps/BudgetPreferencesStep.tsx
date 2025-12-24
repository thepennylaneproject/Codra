import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    BudgetMode,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export const BudgetPreferencesStep = () => {
    const {
        profile,
        updateBudgetPreferences,
        setStep,
    } = useOnboardingStore();
    const state = useOnboardingStore();

    const { budgetPreferences } = profile;
    const stepMeta = STEP_METADATA['budget'];
    const canProceed = canProceedFromStep('budget', state);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
            {/* Progress */}
            <OnboardingProgress currentStep="budget" />

            {/* Header */}
            <header className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stepMeta.title}
                </h1>
                <p className="text-lg text-zinc-500 font-light max-w-lg">
                    {stepMeta.description}
                </p>
            </header>

            {/* Reassurance */}
            <div className="p-5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-sm shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider">Financial Guardrail Active</h3>
                    <p className="text-xs opacity-70">Codra will never exceed your set daily limit without explicit secondary approval.</p>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-14">

                {/* Simplified: Daily Limit Slider */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                            Daily Comfort Limit
                        </label>
                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-serif italic">${budgetPreferences.dailyBudgetLimit || 50}</span>
                    </div>
                    
                    <div className="space-y-4">
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={budgetPreferences.dailyBudgetLimit || 50}
                            onChange={(e) => updateBudgetPreferences({ dailyBudgetLimit: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                        />
                        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">
                            <span>$10 (Conservative)</span>
                            <span>$500 (Enterprise)</span>
                        </div>
                    </div>
                </section>

                {/* Simplified: Optimization Mode */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Spending Strategy
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'smart-balance', label: 'Balanced', desc: 'Optimize for best value per dollar.' },
                            { id: 'high-performance', label: 'Performance', desc: 'Prioritize speed and highest quality.' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => updateBudgetPreferences({ budgetMode: mode.id as BudgetMode })}
                                className={`p-5 text-left border rounded-sm transition-all duration-200 ${budgetPreferences.budgetMode === mode.id
                                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900 shadow-sm'
                                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-semibold text-sm ${budgetPreferences.budgetMode === mode.id ? 'text-zinc-900 dark:text-zinc-100' : ''}`}>{mode.label}</span>
                                    {budgetPreferences.budgetMode === mode.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                                </div>
                                <p className="text-xs opacity-70 leading-relaxed">{mode.desc}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="text-center">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-loose">
                        8 complex settings collapsed into smart defaults.<br/>
                        Advanced controls available in Project Settings later.
                    </p>
                </div>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-900">
                <button
                    onClick={() => setStep('ai-preferences')}
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
                        onClick={() => setStep('visual')}
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
