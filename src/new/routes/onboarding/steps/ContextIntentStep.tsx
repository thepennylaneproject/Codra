import { useOnboardingStore, STEP_METADATA, canProceedFromStep } from '../store';
import { OnboardingProgress } from '../components/OnboardingProgress';
import {
    CREATIVE_GOAL_OPTIONS,
    PRIMARY_AUDIENCE_OPTIONS,
    PROJECT_TYPE_OPTIONS,
    STORY_STATEMENT_OPTIONS,
    CreativeGoal,
} from '../../../../domain/onboarding-types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/Button';

export const ContextIntentStep = () => {
    const {
        profile,
        updateContext,
        updateTearSheetIntent,
        setStep,
        updateLegacyData,
    } = useOnboardingStore();
    const state = useOnboardingStore();

    const { context, tearSheetIntent } = profile;
    const stepMeta = STEP_METADATA.context;
    const canProceed = canProceedFromStep('context', state);

    // Toggle helpers for multi-select (max 3)
    const toggleCreativeGoal = (goal: CreativeGoal) => {
        const current = context.creativeGoals;
        if (current.includes(goal)) {
            updateContext({ creativeGoals: current.filter(g => g !== goal) });
        } else if (current.length < 3) {
            updateContext({ creativeGoals: [...current, goal] });
        }
    };

    const handleContinue = () => {
        // Sync to legacy data for compatibility
        updateLegacyData({
            description: context.firstProjectDescription,
            goals: context.creativeGoals.map(g => g.replace(/-/g, ' ')),
        });
        setStep('ai-preferences');
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
            {/* Progress */}
            <OnboardingProgress currentStep="context" />

            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-coral)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-ink-muted)]">Initial Consultation</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[var(--color-ink)] leading-[0.9]">
                    Define the <br />
                    <span className="italic font-serif font-light text-[var(--color-brand-coral)]">Production Intent</span>
                </h1>
                <p className="text-xl text-[var(--color-ink-light)] font-medium italic max-w-sm leading-relaxed">
                    "Great work starts with a clear assignment. Define the boundaries of this production."
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-16">

                {/* Q1: Project Name & Description */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-coral)]">
                        The Briefing
                    </label>
                    <textarea
                        value={context.firstProjectDescription}
                        onChange={(e) => updateContext({ firstProjectDescription: e.target.value })}
                        placeholder="Define the scope: e.g., A high-fidelity brand system..."
                        className="w-full bg-transparent border-b border-[var(--color-ink)]/10 p-0 pb-8 text-3xl font-serif font-light focus:outline-none focus:border-[var(--color-brand-coral)] transition-all resize-none min-h-[80px] placeholder:text-[var(--color-ink)]/10 italic"
                        maxLength={200}
                    />
                    <p className="text-[10px] text-[var(--color-ink-muted)] font-black uppercase tracking-widest leading-none">{context.firstProjectDescription.length}/200</p>
                </section>

                {/* Merged: Product Story Statement */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
                        Strategic Narrative
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {STORY_STATEMENT_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updateTearSheetIntent({ storyStatement: option.id })}
                                className={`p-8 text-left border rounded-[24px] transition-all duration-500 group ${tearSheetIntent.storyStatement === option.id
                                    ? 'border-[var(--color-brand-coral)] bg-[var(--color-brand-coral)]/5 shadow-2xl shadow-[var(--color-brand-coral)]/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`font-black text-[10px] uppercase tracking-widest ${tearSheetIntent.storyStatement === option.id ? 'text-[var(--color-brand-coral)]' : 'text-[var(--color-ink)]'}`}>{option.label}</span>
                                    {tearSheetIntent.storyStatement === option.id && <Check size={14} strokeWidth={4} className="text-[var(--color-brand-coral)]" />}
                                </div>
                                <p className="text-[11px] text-[var(--color-ink-muted)] font-medium leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Merged: Core Message */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        The North Star Message
                    </label>
                    <textarea
                        value={tearSheetIntent.coreMessage}
                        onChange={(e) => updateTearSheetIntent({ coreMessage: e.target.value })}
                        placeholder="What is the single most important thing someone should feel or know?"
                        className="w-full bg-white border border-[var(--color-ink)]/10 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-[var(--color-brand-coral)] focus:ring-4 focus:ring-[var(--color-brand-coral)]/5 transition-all resize-none min-h-[100px] placeholder:text-[var(--color-ink)]/20 shadow-sm"
                        maxLength={150}
                    />
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)]">
                        <span>Emotional Resonance</span>
                        <span>{tearSheetIntent.coreMessage.length}/150</span>
                    </div>
                </section>

                {/* Q2: Project Type */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A]">
                        Production Class
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PROJECT_TYPE_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => state.setProjectType(option.id)}
                                className={`p-5 text-left border rounded-xl transition-all duration-500 ${profile.projectType === option.id
                                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-xl'
                                    : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30 bg-white'
                                    }`}
                            >
                                <div className="font-black text-[10px] uppercase tracking-widest">{option.label}</div>
                                <p className={`text-[10px] font-medium mt-1 leading-tight ${profile.projectType === option.id ? 'text-white/60' : 'text-[var(--color-ink-muted)]'}`}>{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q3: Audience */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Who is this for?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRIMARY_AUDIENCE_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updateContext({ primaryAudience: option.id })}
                                className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${context.primaryAudience === option.id
                                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-md'
                                    : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Q4: Deliverables */}
                <section className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                        What outputs do you need? <span className="text-zinc-300 lowercase italic">(pick up to 3)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CREATIVE_GOAL_OPTIONS.map(option => {
                            const isSelected = context.creativeGoals.includes(option.id);
                            const isDisabled = !isSelected && context.creativeGoals.length >= 3;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => toggleCreativeGoal(option.id)}
                                    disabled={isDisabled}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-md'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/10 text-[var(--color-ink-muted)] cursor-not-allowed'
                                            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--color-ink)]/5">
                <Button
                    variant="ghost"
                    onClick={() => setStep('mode')}
                    leftIcon={<ArrowLeft size={16} strokeWidth={3} />}
                    className="text-[10px] font-black uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                    Registration
                </Button>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-medium italic font-serif text-[var(--color-ink-muted)]">
                        {stepMeta.helperText}
                    </span>
                    <Button
                        variant="primary"
                        onClick={handleContinue}
                        disabled={!canProceed}
                        rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                        className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};
