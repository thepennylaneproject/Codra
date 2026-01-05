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
import { Button } from '@/components/ui/Button';

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-12">
            {/* Progress */}
            <OnboardingProgress currentStep="context" />

            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span className="text-xs font-semibold text-text-soft">Initial Consultation</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tighter text-text-primary leading-[0.9]">
                    Define the <br />
                    <span className="italic font-serif font-normal text-zinc-500">Production Intent</span>
                </h1>
                <p className="text-xl text-text-secondary font-medium italic max-w-sm leading-relaxed">
                    &quot;Great work starts with a clear assignment. Define the boundaries of this production.&quot;
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-12">

                {/* Q1: Project Name & Description */}
                <section className="space-y-6">
                    <label className="block text-xs font-semibold text-zinc-500">The Briefing</label>
                    <textarea
                        value={context.firstProjectDescription}
                        onChange={(e) => updateContext({ firstProjectDescription: e.target.value })}
                        placeholder="Define the scope: e.g., A high-fidelity brand system..."
                        className="w-full bg-transparent border-b border-[var(--color-ink)]/10 p-0 pb-8 text-xl font-serif font-normal focus:outline-none focus:border-zinc-400 transition-all resize-none min-h-[80px] placeholder:text-text-primary/10 italic"
                        maxLength={200}
                    />
                    <p className="text-xs text-text-soft font-semibold leading-none">
                        {context.firstProjectDescription.length}/200
                    </p>
                </section>

                {/* Merged: Product Story Statement */}
                <section className="space-y-6">
                    <label className="block text-xs font-semibold text-text-soft">Strategic Narrative</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {STORY_STATEMENT_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => updateTearSheetIntent({ storyStatement: option.id })}
                                className={`p-8 text-left border rounded-[24px] transition-all duration-500 group ${tearSheetIntent.storyStatement === option.id
                                    ? 'border-zinc-400 bg-zinc-200/40 shadow-2xl shadow-zinc-500/10'
                                    : 'border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-xs font-semibold ${tearSheetIntent.storyStatement === option.id ? 'text-zinc-500' : 'text-text-primary'}`}>
                                        {option.label}
                                    </span>
                                    {tearSheetIntent.storyStatement === option.id && <Check size={14} strokeWidth={4} className="text-zinc-500" />}
                                </div>
                                <p className="text-xs text-text-soft font-medium leading-relaxed">{option.description}</p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Merged: Core Message */}
                <section className="space-y-6">
                    <label className="block text-xs font-semibold text-text-soft">The North Star Message</label>
                    <textarea
                        value={tearSheetIntent.coreMessage}
                        onChange={(e) => updateTearSheetIntent({ coreMessage: e.target.value })}
                        placeholder="What is the single most important thing someone should feel or know?"
                        className="w-full bg-white border border-[var(--color-ink)]/10 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-400/5 transition-all resize-none min-h-[100px] placeholder:text-text-primary/20 shadow-sm"
                        maxLength={150}
                    />
                    <div className="flex justify-between items-center text-xs font-semibold text-text-soft">
                        <span>Emotional Resonance</span>
                        <span>{tearSheetIntent.coreMessage.length}/150</span>
                    </div>
                </section>

                {/* Q2: Project Type */}
                <section className="space-y-6">
                    <label className="block text-xs font-semibold text-text-soft">Production Class</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PROJECT_TYPE_OPTIONS.map(option => (
                            <Button
                                key={option.id}
                                onClick={() => state.setProjectType(option.id)}
                                className={`p-4 text-left border rounded-xl transition-all duration-500 ${profile.projectType === option.id
                                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-xl'
                                    : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30 bg-white'
                                    }`}
                            >
                                <div className="text-xs font-semibold">{option.label}</div>
                                <p className={`text-xs font-medium mt-1 leading-tight ${profile.projectType === option.id ? 'text-white/80' : 'text-text-soft'}`}>
                                    {option.description}
                                </p>
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q3: Audience */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        Who is this for?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRIMARY_AUDIENCE_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                onClick={() => updateContext({ primaryAudience: option.id })}
                                className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${context.primaryAudience === option.id
                                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-md'
                                    : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                    }`}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </section>

                {/* Q4: Deliverables */}
                <section className="space-y-4">
                    <label className="block text-xs font-semibold text-zinc-400">
                        What outputs do you need? <span className="text-zinc-300 italic">(pick up to 3)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {CREATIVE_GOAL_OPTIONS.map(option => {
                            const isSelected = context.creativeGoals.includes(option.id);
                            const isDisabled = !isSelected && context.creativeGoals.length >= 3;
                            return (
                                <Button
                                    key={option.id}
                                    onClick={() => toggleCreativeGoal(option.id)}
                                    disabled={isDisabled}
                                    className={`px-4 py-2 text-sm border rounded-full transition-all duration-200 ${isSelected
                                        ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-md'
                                        : isDisabled
                                            ? 'border-[var(--color-ink)]/10 text-text-soft cursor-not-allowed'
                                            : 'border-[var(--color-ink)]/10 hover:border-[var(--color-ink)]/30'
                                        }`}
                                >
                                    {option.label}
                                </Button>
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
                    className="text-xs font-semibold text-text-soft hover:text-text-primary transition-colors"
                >
                    Registration
                </Button>
                <div className="flex items-center gap-6">
                    <span className="text-xs font-semibold text-text-soft">
                        {stepMeta.helperText}
                    </span>
                    <Button
                        variant="primary"
                        onClick={handleContinue}
                        disabled={!canProceed}
                        rightIcon={<ArrowRight size={16} strokeWidth={3} />}
                        className="px-8 py-4 text-xs font-semibold shadow-2xl active:scale-95"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};
