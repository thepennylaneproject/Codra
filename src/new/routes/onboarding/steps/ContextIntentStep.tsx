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
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8A8A]">Initial Consultation</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-[#1A1A1A] leading-[0.9]">
                    Define the <br />
                    <span className="italic font-serif font-light text-[#FF4D4D]">Production Intent</span>
                </h1>
                <p className="text-xl text-[#5A5A5A] font-medium italic max-w-sm leading-relaxed">
                    "Great work starts with a clear assignment. Define the boundaries of this production."
                </p>
            </header>

            {/* Questions */}
            <div className="space-y-16">

                {/* Q1: Project Name & Description */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#FF4D4D]">
                        The Briefing
                    </label>
                    <textarea
                        value={context.firstProjectDescription}
                        onChange={(e) => updateContext({ firstProjectDescription: e.target.value })}
                        placeholder="Define the scope: e.g., A high-fidelity brand system..."
                        className="w-full bg-transparent border-b border-[#1A1A1A]/10 p-0 pb-8 text-3xl font-serif font-light focus:outline-none focus:border-[#FF4D4D] transition-all resize-none min-h-[80px] placeholder:text-[#1A1A1A]/10 italic"
                        maxLength={200}
                    />
                    <p className="text-[10px] text-[#8A8A8A] font-black uppercase tracking-widest leading-none">{context.firstProjectDescription.length}/200</p>
                </section>

                {/* Merged: Product Story Statement */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A]">
                        Strategic Narrative
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {STORY_STATEMENT_OPTIONS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => updateTearSheetIntent({ storyStatement: option.id })}
                                className={`p-8 text-left border rounded-[24px] transition-all duration-500 group ${tearSheetIntent.storyStatement === option.id
                                    ? 'border-[#FF4D4D] bg-[#FF4D4D]/5 shadow-2xl shadow-[#FF4D4D]/10'
                                    : 'border-[#1A1A1A]/5 hover:border-[#1A1A1A]/20 bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`font-black text-[10px] uppercase tracking-widest ${tearSheetIntent.storyStatement === option.id ? 'text-[#FF4D4D]' : 'text-[#1A1A1A]'}`}>{option.label}</span>
                                    {tearSheetIntent.storyStatement === option.id && <Check size={14} strokeWidth={4} className="text-[#FF4D4D]" />}
                                </div>
                                <p className="text-[11px] text-[#8A8A8A] font-medium leading-relaxed">{option.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Merged: Core Message */}
                <section className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        The North Star Message
                    </label>
                    <textarea
                        value={tearSheetIntent.coreMessage}
                        onChange={(e) => updateTearSheetIntent({ coreMessage: e.target.value })}
                        placeholder="What is the single most important thing someone should feel or know?"
                        className="w-full bg-white border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-[#FF4D4D] focus:ring-4 focus:ring-[#FF4D4D]/5 transition-all resize-none min-h-[100px] placeholder:text-zinc-300 dark:placeholder:text-zinc-700 shadow-sm"
                        maxLength={150}
                    />
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-300">
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
                                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl'
                                    : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 bg-white'
                                    }`}
                            >
                                <div className="font-black text-[10px] uppercase tracking-widest">{option.label}</div>
                                <p className={`text-[10px] font-medium mt-1 leading-tight ${profile.projectType === option.id ? 'text-white/60' : 'text-[#8A8A8A]'}`}>{option.description}</p>
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
                                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                                    : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
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
                                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                                        : isDisabled
                                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed'
                                            : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
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
            <div className="flex justify-between items-center pt-8 border-t border-[#1A1A1A]/5">
                <button
                    onClick={() => setStep('mode')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={3} />
                    Registration
                </button>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-medium italic font-serif text-[#8A8A8A]">
                        {stepMeta.helperText}
                    </span>
                    <button
                        onClick={handleContinue}
                        disabled={!canProceed}
                        className="flex items-center gap-3 bg-[#1A1A1A] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#FF4D4D] transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded-2xl shadow-2xl active:scale-95"
                    >
                        Continue
                        <ArrowRight size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};
