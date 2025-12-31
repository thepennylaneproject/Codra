import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    BudgetMode,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/Button';

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
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-coral)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">Financial Governance</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[var(--color-ink)] leading-none">
                    {stepMeta.title.split(' ')[0]} <br />
                    <span className="italic font-serif font-light text-[var(--color-brand-coral)]">{stepMeta.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-[var(--color-ink-light)] font-medium italic max-w-lg leading-relaxed">
                    "{stepMeta.description}"
                </p>
            </header>

            {/* Reassurance */}
            <div className="p-8 bg-[var(--color-ink)] text-white rounded-[24px] shadow-2xl flex items-center gap-6 group hover:scale-[1.02] transition-transform duration-500">
                <div className="w-14 h-14 bg-[var(--color-brand-coral)] rounded-2xl flex items-center justify-center flex-shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
                    <Check size={28} strokeWidth={4} className="text-white" />
                </div>
                <div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-[var(--color-brand-coral)]">Financial Guardrail Active</h3>
                    <p className="text-sm opacity-70 font-medium italic leading-tight">"Codra will never exceed your set daily limit without explicit secondary approval."</p>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-14">

                {/* Simplified: Daily Limit Slider */}
                <section className="space-y-8 p-8 bg-white border border-[var(--color-ink)]/5 rounded-[32px] shadow-sm">
                    <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                            Daily Comfort Limit
                        </label>
                        <span className="text-4xl font-black text-[var(--color-ink)] font-serif italic tracking-tighter">${budgetPreferences.dailyBudgetLimit || 50}</span>
                    </div>
                    
                    <div className="space-y-6">
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={budgetPreferences.dailyBudgetLimit || 50}
                            onChange={(e) => updateBudgetPreferences({ dailyBudgetLimit: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-[var(--color-ink)]/5 rounded-full appearance-none cursor-pointer accent-[var(--color-brand-coral)]"
                        />
                        <div className="flex justify-between text-[9px] uppercase font-black text-[var(--color-ink-muted)] tracking-widest">
                            <span>$10 <span className="opacity-40 italic lowercase font-serif font-normal ml-1">conservative</span></span>
                            <span>$500 <span className="opacity-40 italic lowercase font-serif font-normal ml-1">enterprise</span></span>
                        </div>
                    </div>
                </section>

                {/* Simplified: Optimization Mode */}
                <section className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        Spending Strategy
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'smart-balance', label: 'Balanced', desc: 'Optimize for best value per dollar.' },
                            { id: 'high-performance', label: 'Performance', desc: 'Prioritize speed and highest quality.' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => updateBudgetPreferences({ budgetMode: mode.id as BudgetMode })}
                                className={`p-6 text-left border rounded-[24px] transition-all duration-500 ${budgetPreferences.budgetMode === mode.id
                                    ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`font-black text-[10px] uppercase tracking-widest ${budgetPreferences.budgetMode === mode.id ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{mode.label}</span>
                                    {budgetPreferences.budgetMode === mode.id && <Check size={14} strokeWidth={4} className="text-[var(--color-brand-coral)]" />}
                                </div>
                                <p className="text-[11px] text-[var(--color-ink-muted)] font-medium leading-relaxed">{mode.desc}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="text-center p-8 border border-[var(--color-ink)]/5 rounded-[32px] bg-white/50">
                    <p className="text-[10px] text-[var(--color-ink-muted)] font-black uppercase tracking-widest leading-loose">
                        8 complex settings collapsed into smart defaults.<br/>
                        <span className="opacity-40 lowercase italic font-serif font-medium">Advanced controls available in Project Settings later.</span>
                    </p>
                </div>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ink)]/5">
                <Button
                    variant="ghost"
                    onClick={() => setStep('ai-preferences')}
                    leftIcon={<ArrowLeft size={16} strokeWidth={3} />}
                    className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                    Preferences
                </Button>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-medium italic font-serif text-[var(--color-ink-muted)]">
                        {stepMeta.helperText}
                    </span>
                    <Button
                        variant="primary"
                        onClick={() => setStep('visual')}
                        disabled={!canProceed}
                        rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                        className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95"
                    >
                        Align Aesthetics
                    </Button>
                </div>
            </div>
        </div>
    );
};
